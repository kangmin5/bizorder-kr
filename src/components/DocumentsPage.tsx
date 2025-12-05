import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Search, 
  Trash2, 
  Download, 
  Upload, 
  FolderOpen,
  Plus,
  RefreshCw,
  Cloud,
  Calendar,
  Building2,
  Package
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { useDocumentStore } from '../stores/useDocumentStore';
import { SavedDocument } from '../utils/indexedDB';

// 문서 타입별 아이콘과 색상
const documentTypeConfig = {
  quotation: {
    icon: FileText,
    label: '견적서',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    path: '/quotation'
  },
  purchase_order: {
    icon: ShoppingCart,
    label: '발주서',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    path: '/purchase-order'
  },
  transaction_statement: {
    icon: Receipt,
    label: '거래명세서',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    path: '/transaction-statement'
  }
};

export function DocumentsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    documents,
    isLoading,
    searchQuery,
    filterType,
    isSyncing,
    loadDocuments,
    deleteDocument,
    setSearchQuery,
    setFilterType,
    exportDocument,
    importDocument,
    exportAllDocuments,
    syncToCloud,
  } = useDocumentStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleOpenDocument = (doc: SavedDocument) => {
    const config = documentTypeConfig[doc.type];
    navigate(`${config.path}?id=${doc.id}`);
  };

  const handleNewDocument = (type: SavedDocument['type']) => {
    const config = documentTypeConfig[type];
    navigate(config.path);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importDocument(file);
        alert('문서를 성공적으로 가져왔습니다.');
      } catch (error) {
        alert('문서 가져오기에 실패했습니다.');
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내 문서함</h1>
          <p className="text-gray-500 mt-1">저장된 문서를 관리하고 편집하세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => syncToCloud()} disabled={isSyncing}>
            <Cloud className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '동기화 중...' : '클라우드 동기화'}
          </Button>
        </div>
      </div>

      {/* 새 문서 생성 버튼들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Object.entries(documentTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <Card 
              key={type}
              className={`cursor-pointer hover:shadow-md transition-shadow ${config.borderColor} border-2`}
              onClick={() => handleNewDocument(type as SavedDocument['type'])}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg ${config.bgColor}`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">새 {config.label}</h3>
                  <p className="text-sm text-gray-500">새 문서 작성하기</p>
                </div>
                <Plus className="w-5 h-5 text-gray-400 ml-auto" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="문서 제목 또는 거래처명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="문서 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 문서</SelectItem>
                <SelectItem value="quotation">견적서</SelectItem>
                <SelectItem value="purchase_order">발주서</SelectItem>
                <SelectItem value="transaction_statement">거래명세서</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileImport}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                가져오기
              </Button>
              <Button variant="outline" onClick={() => exportAllDocuments()}>
                <Download className="w-4 h-4 mr-2" />
                전체 백업
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 문서 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">저장된 문서가 없습니다</h3>
            <p className="text-gray-400 mb-4">새 문서를 작성하거나 파일을 가져오세요</p>
            <div className="flex justify-center gap-2">
              <Button onClick={() => handleNewDocument('quotation')}>
                <Plus className="w-4 h-4 mr-2" />
                새 견적서 작성
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const config = documentTypeConfig[doc.type];
            const Icon = config.icon;
            
            return (
              <Card 
                key={doc.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${config.borderColor} border-l-4`}
                onClick={() => handleOpenDocument(doc)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* 아이콘 */}
                    <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    
                    {/* 문서 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {doc.clientName || '(거래처 미지정)'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {doc.itemCount}개 품목
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(doc.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 금액 */}
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${config.color}`}>
                        {formatCurrency(doc.total)}
                      </p>
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => exportDocument(doc)}
                        title="내보내기"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50"
                        title="삭제"
                        onClick={() => {
                          if (confirm(`"${doc.title}" 문서를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                            deleteDocument(doc.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
