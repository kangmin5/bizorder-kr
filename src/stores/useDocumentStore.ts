import { create } from 'zustand';
import { 
  SavedDocument, 
  saveDocument as saveToIndexedDB, 
  getDocument as getFromIndexedDB,
  getAllDocuments as getAllFromIndexedDB,
  deleteDocument as deleteFromIndexedDB,
  searchDocuments as searchInIndexedDB,
  exportToJSON,
  importFromJSON,
  exportAllToJSON
} from '../utils/indexedDB';

interface DocumentState {
  // 현재 편집 중인 문서
  currentDocument: SavedDocument | null;
  currentDocumentId: string | null;
  isModified: boolean;
  
  // 문서 목록
  documents: SavedDocument[];
  isLoading: boolean;
  error: string | null;
  
  // 검색/필터
  searchQuery: string;
  filterType: SavedDocument['type'] | 'all';
  
  // 동기화 상태
  isSyncing: boolean;
  lastSyncedAt: string | null;
  
  // Actions
  setCurrentDocument: (doc: SavedDocument | null) => void;
  setModified: (modified: boolean) => void;
  
  // 로컬 저장
  saveDocument: (doc: Omit<SavedDocument, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<string>;
  loadDocument: (id: string) => Promise<SavedDocument | null>;
  deleteDocument: (id: string) => Promise<void>;
  
  // 목록
  loadDocuments: (type?: SavedDocument['type']) => Promise<void>;
  searchDocuments: (query: string) => Promise<void>;
  setFilterType: (type: SavedDocument['type'] | 'all') => void;
  setSearchQuery: (query: string) => void;
  
  // 파일 가져오기/내보내기
  exportDocument: (doc: SavedDocument) => void;
  importDocument: (file: File) => Promise<SavedDocument>;
  exportAllDocuments: () => Promise<void>;
  
  // Supabase 동기화 (나중에 구현)
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  currentDocument: null,
  currentDocumentId: null,
  isModified: false,
  
  documents: [],
  isLoading: false,
  error: null,
  
  searchQuery: '',
  filterType: 'all',
  
  isSyncing: false,
  lastSyncedAt: null,
  
  setCurrentDocument: (doc) => set({ 
    currentDocument: doc, 
    currentDocumentId: doc?.id || null,
    isModified: false 
  }),
  
  setModified: (modified) => set({ isModified: modified }),
  
  saveDocument: async (docData) => {
    const now = new Date().toISOString();
    const isNew = !docData.id;
    
    const doc: SavedDocument = {
      id: docData.id || crypto.randomUUID(),
      type: docData.type,
      title: docData.title,
      clientName: docData.clientName,
      total: docData.total,
      itemCount: docData.itemCount,
      data: docData.data,
      createdAt: isNew ? now : (get().currentDocument?.createdAt || now),
      updatedAt: now,
    };
    
    try {
      await saveToIndexedDB(doc);
      set({ 
        currentDocument: doc, 
        currentDocumentId: doc.id,
        isModified: false 
      });
      
      // 목록 새로고침
      const filterType = get().filterType;
      await get().loadDocuments(filterType === 'all' ? undefined : filterType);
      
      return doc.id;
    } catch (error) {
      set({ error: '문서 저장에 실패했습니다' });
      throw error;
    }
  },
  
  loadDocument: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const doc = await getFromIndexedDB(id);
      if (doc) {
        set({ 
          currentDocument: doc, 
          currentDocumentId: doc.id,
          isModified: false,
          isLoading: false 
        });
      }
      return doc;
    } catch (error) {
      set({ error: '문서 불러오기에 실패했습니다', isLoading: false });
      return null;
    }
  },
  
  deleteDocument: async (id) => {
    try {
      await deleteFromIndexedDB(id);
      
      // 현재 문서가 삭제된 문서면 초기화
      if (get().currentDocumentId === id) {
        set({ currentDocument: null, currentDocumentId: null, isModified: false });
      }
      
      // 목록 새로고침
      const filterType = get().filterType;
      await get().loadDocuments(filterType === 'all' ? undefined : filterType);
    } catch (error) {
      set({ error: '문서 삭제에 실패했습니다' });
      throw error;
    }
  },
  
  loadDocuments: async (type) => {
    set({ isLoading: true, error: null });
    
    try {
      const docs = await getAllFromIndexedDB(type);
      set({ documents: docs, isLoading: false });
    } catch (error) {
      set({ error: '문서 목록 불러오기에 실패했습니다', isLoading: false });
    }
  },
  
  searchDocuments: async (query) => {
    set({ isLoading: true, searchQuery: query });
    
    try {
      const filterType = get().filterType;
      const type = filterType === 'all' ? undefined : filterType;
      const docs = await searchInIndexedDB(query, type);
      set({ documents: docs, isLoading: false });
    } catch (error) {
      set({ error: '검색에 실패했습니다', isLoading: false });
    }
  },
  
  setFilterType: (type) => {
    set({ filterType: type });
    const docType = type === 'all' ? undefined : type;
    get().loadDocuments(docType);
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (query) {
      get().searchDocuments(query);
    } else {
      const filterType = get().filterType;
      get().loadDocuments(filterType === 'all' ? undefined : filterType);
    }
  },
  
  exportDocument: (doc) => {
    exportToJSON(doc);
  },
  
  importDocument: async (file) => {
    try {
      const doc = await importFromJSON(file);
      await saveToIndexedDB(doc);
      const filterType = get().filterType;
      await get().loadDocuments(filterType === 'all' ? undefined : filterType);
      return doc;
    } catch (error) {
      set({ error: '파일 가져오기에 실패했습니다' });
      throw error;
    }
  },
  
  exportAllDocuments: async () => {
    const filterType = get().filterType;
    const type = filterType === 'all' ? undefined : filterType;
    await exportAllToJSON(type);
  },
  
  // Supabase 동기화 (추후 구현)
  syncToCloud: async () => {
    set({ isSyncing: true });
    
    try {
      // TODO: Supabase에 문서 업로드
      // const docs = await getAllFromIndexedDB();
      // await supabaseClient.from('documents').upsert(docs);
      
      set({ 
        isSyncing: false, 
        lastSyncedAt: new Date().toISOString() 
      });
    } catch (error) {
      set({ isSyncing: false, error: '클라우드 동기화에 실패했습니다' });
    }
  },
  
  syncFromCloud: async () => {
    set({ isSyncing: true });
    
    try {
      // TODO: Supabase에서 문서 다운로드
      // const { data } = await supabaseClient.from('documents').select('*');
      // for (const doc of data) { await saveToIndexedDB(doc); }
      
      const filterType = get().filterType;
      await get().loadDocuments(filterType === 'all' ? undefined : filterType);
      
      set({ 
        isSyncing: false, 
        lastSyncedAt: new Date().toISOString() 
      });
    } catch (error) {
      set({ isSyncing: false, error: '클라우드에서 불러오기에 실패했습니다' });
    }
  },
}));
