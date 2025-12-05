import { useState, useEffect } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  fileName: string;
}

export function PDFPreviewModal({ isOpen, onClose, pdfBlob, fileName }: PDFPreviewModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.click();
    onClose();
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-5xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">PDF 미리보기</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              인쇄
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              다운로드
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* PDF 뷰어 */}
        <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
          <iframe
            id="pdf-preview-iframe"
            src={pdfUrl}
            className="w-full h-full rounded border bg-white"
            title="PDF Preview"
          />
        </div>
        
        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleDownload}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PDFPreviewModal;
