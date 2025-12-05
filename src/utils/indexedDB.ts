// IndexedDB 유틸리티 - 로컬 문서 저장소

const DB_NAME = 'bizorder_documents';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export interface SavedDocument {
  id: string;
  type: 'quotation' | 'purchase_order' | 'transaction_statement';
  title: string;
  clientName: string;
  total: number;
  itemCount: number;
  data: any; // 문서 전체 데이터
  createdAt: string;
  updatedAt: string;
  syncedAt?: string; // Supabase 동기화 시간
  userId?: string;
}

let db: IDBDatabase | null = null;

// DB 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('IndexedDB 열기 실패'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('clientName', 'clientName', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

// 문서 저장
export const saveDocument = async (doc: SavedDocument): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(doc);
    
    request.onerror = () => reject(new Error('문서 저장 실패'));
    request.onsuccess = () => resolve();
  });
};

// 문서 조회
export const getDocument = async (id: string): Promise<SavedDocument | null> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    
    request.onerror = () => reject(new Error('문서 조회 실패'));
    request.onsuccess = () => resolve(request.result || null);
  });
};

// 모든 문서 조회 (타입별)
export const getAllDocuments = async (type?: SavedDocument['type']): Promise<SavedDocument[]> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    let request: IDBRequest;
    
    if (type) {
      const index = store.index('type');
      request = index.getAll(type);
    } else {
      request = store.getAll();
    }
    
    request.onerror = () => reject(new Error('문서 목록 조회 실패'));
    request.onsuccess = () => {
      const docs = request.result as SavedDocument[];
      // 최신순 정렬
      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(docs);
    };
  });
};

// 문서 삭제
export const deleteDocument = async (id: string): Promise<void> => {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onerror = () => reject(new Error('문서 삭제 실패'));
    request.onsuccess = () => resolve();
  });
};

// 문서 검색 (제목, 거래처명)
export const searchDocuments = async (query: string, type?: SavedDocument['type']): Promise<SavedDocument[]> => {
  const docs = await getAllDocuments(type);
  const lowerQuery = query.toLowerCase();
  
  return docs.filter(doc => 
    doc.title.toLowerCase().includes(lowerQuery) ||
    doc.clientName.toLowerCase().includes(lowerQuery)
  );
};

// JSON 파일로 내보내기
export const exportToJSON = (doc: SavedDocument): void => {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.title}_${doc.updatedAt.split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// JSON 파일에서 가져오기
export const importFromJSON = (file: File): Promise<SavedDocument> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const doc = JSON.parse(e.target?.result as string) as SavedDocument;
        // 새 ID 생성 (중복 방지)
        doc.id = crypto.randomUUID();
        doc.updatedAt = new Date().toISOString();
        resolve(doc);
      } catch {
        reject(new Error('잘못된 파일 형식입니다'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
};

// 여러 문서 내보내기 (백업용)
export const exportAllToJSON = async (type?: SavedDocument['type']): Promise<void> => {
  const docs = await getAllDocuments(type);
  const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bizorder_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
