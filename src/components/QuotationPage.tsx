import { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Download,
  Settings2,
  PanelLeft,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { type ImperativePanelHandle } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";

import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';

import { usePageSplitter } from '../hooks/useDocumentPagination';
import { useSettingsStore } from '../stores/useSettingsStore';

// --- Types ---

interface LineItem {
  id: string;
  name: string;
  spec: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
}

interface CompanyInfo {
  name: string;
  registrationNumber: string;
  ownerName: string;
  department?: string;   // 부서
  position?: string;     // 직책/직위
  address: string;
  businessType: string;
  businessItem: string;
  email: string;
  phone: string;
  fax: string;
  stampImage?: string;
}

interface QuotationData {
  quotationNumber: string;
  date: string;
  validUntil: string;
  supplier: CompanyInfo;
  client: CompanyInfo;
  items: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  vatIncluded: boolean;
  remarks: string;
  paymentTerms: string;
  deliveryTerms: string;
}

type PaperSize = 'A4' | 'A3' | 'B5';
type Orientation = 'portrait' | 'landscape';
type Theme = 'classic' | 'modern' | 'minimal' | 'bold' | 'blue' | 'dark';

type PageSettings = {
  paperSize: PaperSize;
  orientation: Orientation;
  theme: Theme;
  showPageNumbers: boolean;
  margins: number; // mm
}

// --- Constants ---

const INITIAL_ITEM: LineItem = {
  id: '',
  name: '',
  spec: '',
  unit: 'EA',
  quantity: 0,
  unitPrice: 0,
  amount: 0,
  note: ''
};

const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  B5: { width: 176, height: 250 },
};

const SECTION_HEIGHTS = {
  HEADER_FIRST: 55,   // 헤더 영역 (콤팩트 레이아웃, 약 5.5cm)
  HEADER_NEXT: 10,    // 2페이지 상단 여백
  TABLE_HEADER: 10,   // 테이블 헤더
  ROW: 8,             // 품목 1줄
  SUMMARY_ROW: 8,     // 소계/부가세/합계 1줄
  REMARKS_BASE: 25,   // 비고 영역 기본
  REMARKS_LINE: 5,    // 비고 줄당
  BUTTON: 10,         // 품목추가 버튼
  FOOTER: 10          // 하단 푸터
};

// --- Helper Components ---

const EditableInput = ({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  type = "text",
  align = "left" 
}: { 
  value: string | number; 
  onChange: (val: string) => void; 
  className?: string;
  placeholder?: string;
  type?: string;
  align?: "left" | "center" | "right";
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn(
      "bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full transition-colors",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}
  />
);

const EditableTextarea = ({ 
  value, 
  onChange, 
  className, 
  placeholder,
  rows = 1
}: { 
  value: string; 
  onChange: (val: string) => void; 
  className?: string;
  placeholder?: string;
  rows?: number;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full resize-none transition-colors overflow-hidden",
        className
      )}
    />
  );
};

// --- Main Component ---

export function QuotationPage() {
  // 설정 스토어에서 값 가져오기
  const { companyInfo, userInfo, bannerSettings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const [settings, setSettings] = useState<PageSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    theme: 'classic',
    showPageNumbers: true,
    margins: 10,
  });

  const [data, setData] = useState<QuotationData>(() => ({
    quotationNumber: `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supplier: {
      name: companyInfo.name || '비즈오더 주식회사',
      registrationNumber: companyInfo.businessNumber || '123-45-67890',
      ownerName: companyInfo.ceoName || '김대표',
      address: companyInfo.address || '서울시 강남구 테헤란로 123',
      businessType: companyInfo.businessType || '서비스',
      businessItem: companyInfo.businessItem || '소프트웨어 개발',
      email: companyInfo.email || 'contact@bizorder.kr',
      phone: companyInfo.phone || '02-1234-5678',
      fax: companyInfo.fax || '02-1234-5679',
      stampImage: bannerSettings.stampImage || undefined,
    },
    client: {
      name: '',
      registrationNumber: '',
      ownerName: '',
      department: '',
      position: '',
      address: '',
      businessType: '',
      businessItem: '',
      email: '',
      phone: '',
      fax: '',
    },
    items: [
      { ...INITIAL_ITEM, id: '1', name: '품목 1', quantity: 1, unitPrice: 10000, amount: 10000 },
    ],
    subtotal: 10000,
    vat: 1000,
    total: 11000,
    vatIncluded: false,
    remarks: '',
    paymentTerms: '계약일로부터 7일 이내',
    deliveryTerms: '발주 후 2주 이내',
  }));

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calculateTotals();
  }, [data.items, data.vatIncluded]);

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    setData({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem = { ...INITIAL_ITEM, id: Math.random().toString(36).substr(2, 9) };
    setData({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    setData({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  const calculateTotals = () => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const vat = data.vatIncluded ? 0 : subtotal * 0.1;
    const total = subtotal + vat;
    setData(prev => ({ ...prev, subtotal, vat, total }));
  };

  const getPaperDimensions = () => {
    const { width, height } = PAPER_DIMENSIONS[settings.paperSize];
    return settings.orientation === 'portrait' 
      ? { width, height } 
      : { width: height, height: width };
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsLoading(true);

    try {
      const pages = printRef.current.querySelectorAll('.page-break');
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.paperSize.toLowerCase(),
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const { width, height } = getPaperDimensions();
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      }

      pdf.save(`${data.quotationNumber}_견적서.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const exportData = [
      ['견적서'],
      ['견적번호', data.quotationNumber],
      ['날짜', data.date],
      [''],
      ['공급자 정보'],
      ['상호', data.supplier.name, '등록번호', data.supplier.registrationNumber],
      ['대표자', data.supplier.ownerName, '전화번호', data.supplier.phone],
      [''],
      ['공급받는자 정보'],
      ['상호', data.client.name, '등록번호', data.client.registrationNumber],
      [''],
      ['품목 목록'],
      ['품명', '규격', '단위', '수량', '단가', '공급가액', '비고'],
      ...data.items.map(item => [
        item.name, item.spec, item.unit, item.quantity, item.unitPrice, item.amount, item.note
      ]),
      [''],
      ['공급가액 합계', data.subtotal],
      ['세액', data.vat],
      ['총 합계', data.total],
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '견적서');
    XLSX.writeFile(wb, `${data.quotationNumber}_견적서.xlsx`);
  };

  const renderThemeStyles = () => {
    switch (settings.theme) {
      case 'modern': return 'bg-white border-l-4 border-blue-500';
      case 'minimal': return 'bg-white grayscale';
      case 'bold': return 'bg-slate-50 font-bold border-4 border-black';
      case 'blue': return 'bg-blue-50 text-blue-900';
      case 'dark': return 'bg-slate-800 text-white';
      default: return 'bg-white border border-gray-200';
    }
  };

  const toggleSidebar = () => {
    const panel = sidebarRef.current;
    if (panel) {
      if (isSidebarOpen) panel.collapse();
      else panel.expand();
    }
  };

  const pages = usePageSplitter(
    [
      ...data.items.map(item => ({ type: 'item' as const, data: item })),
      { type: 'subtotal' as const },
      { type: 'vat' as const },
      { type: 'total' as const }
    ],
    data.remarks,
    {
      paperSize: settings.paperSize,
      margins: settings.margins,
      sectionHeights: SECTION_HEIGHTS
    }
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={toggleSidebar} title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 열기"}>
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">견적서 작성</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 text-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2" 
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              -
            </Button>
            <span className="w-12 text-center">{zoom}%</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2" 
              onClick={() => setZoom(Math.min(200, zoom + 10))}
            >
              +
            </Button>
          </div>
          {/* 페이지 네비게이션 */}
          {pages.length > 1 && (
            <div className="flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1 text-sm">
              <span className="text-gray-500 text-xs mr-1">페이지:</span>
              {pages.map((_, idx) => (
                <Button
                  key={idx}
                  variant={idx === 0 ? "default" : "outline"}
                  size="sm"
                  className="h-6 w-6 p-0 text-xs"
                  onClick={() => {
                    document.getElementById(`page-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {idx + 1}
                </Button>
              ))}
              <span className="text-gray-400 text-xs ml-1">/ {pages.length}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> 인쇄
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> 엑셀
          </Button>
          <Button onClick={handleExportPDF} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" /> 
            {isLoading ? '생성 중...' : 'PDF'}
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar: Settings */}
        <ResizablePanel 
          ref={sidebarRef}
          defaultSize={25} 
          minSize={20} 
          maxSize={40} 
          collapsible={true}
          onCollapse={() => setIsSidebarOpen(false)}
          onExpand={() => setIsSidebarOpen(true)}
          className={cn("bg-gray-50 border-r", !isSidebarOpen && "min-w-[0px] border-none")}
        >
          <div className="h-full overflow-auto">
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Settings2 className="w-5 h-5" />
                문서 설정
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">스타일 & 레이아웃</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>용지 크기</Label>
                    <Select 
                      value={settings.paperSize} 
                      onValueChange={(v: PaperSize) => setSettings({...settings, paperSize: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                        <SelectItem value="A3">A3 (297 x 420 mm)</SelectItem>
                        <SelectItem value="B5">B5 (176 x 250 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>용지 방향</Label>
                    <Select 
                      value={settings.orientation} 
                      onValueChange={(v: Orientation) => setSettings({...settings, orientation: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">세로 (Portrait)</SelectItem>
                        <SelectItem value="landscape">가로 (Landscape)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>테마 선택</Label>
                    <Select 
                      value={settings.theme} 
                      onValueChange={(v: Theme) => setSettings({...settings, theme: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">클래식 (기본)</SelectItem>
                        <SelectItem value="modern">모던 (블루 포인트)</SelectItem>
                        <SelectItem value="minimal">미니멀 (흑백)</SelectItem>
                        <SelectItem value="bold">볼드 (강조)</SelectItem>
                        <SelectItem value="blue">블루 배경</SelectItem>
                        <SelectItem value="dark">다크 모드</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">옵션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vat" 
                      checked={data.vatIncluded}
                      onCheckedChange={(c) => setData({...data, vatIncluded: !!c})}
                    />
                    <Label htmlFor="vat">부가세 포함 단가 적용</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="page-num" 
                      checked={settings.showPageNumbers}
                      onCheckedChange={(c) => setSettings({...settings, showPageNumbers: !!c})}
                    />
                    <Label htmlFor="page-num">페이지 번호 표시</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Main: WYSIWYG Editor */}
        <ResizablePanel defaultSize={75} className="bg-slate-100">
          <div className="h-full overflow-auto">
            <div className="flex flex-col items-center p-8 min-w-[800px] gap-8" ref={printRef}>
              {pages.map((page, pageIndex) => (
                <div 
                  key={pageIndex}
                  id={`page-${pageIndex}`}
                  className={cn(
                    "shadow-lg transition-all duration-300 p-[10mm] box-border relative bg-white flex flex-col page-break overflow-hidden",
                    renderThemeStyles()
                  )}
                  style={{
                    width: `${getPaperDimensions().width}mm`,
                    height: `${getPaperDimensions().height}mm`,
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    marginBottom: '2rem',
                  }}
                >
                  {/* [Section] Document Header - 콤팩트 레이아웃 */}
                  {page.isFirst && (
                    <>
                      {/* 배너 이미지 - 상단 위치인 경우 */}
                      {bannerSettings.bannerImage && bannerSettings.position === 'top' && (
                        <div className="mb-2 flex justify-center">
                          <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-12 object-contain" />
                        </div>
                      )}

                      {/* 제목 + 총금액 라인 */}
                      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                        <div className="flex items-center gap-3">
                          {bannerSettings.bannerImage && bannerSettings.position === 'left' && (
                            <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                          )}
                          <h1 className="text-3xl font-bold tracking-widest">견 적 서</h1>
                          {bannerSettings.bannerImage && bannerSettings.position === 'right' && (
                            <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                          )}
                        </div>
                        <p className="text-xl font-bold text-red-600">
                          {data.total.toLocaleString()} 원 <span className="text-sm text-black font-normal">(VAT 포함)</span>
                        </p>
                      </div>

                      {/* 좌측: 메타+수신처 / 우측: 공급자+담당자 */}
                      <div className="flex gap-4 mb-3 text-xs">
                        {/* 좌측 영역 */}
                        <div className="flex-1 space-y-2">
                          {/* 메타데이터 */}
                          <div className="grid grid-cols-[70px_1fr_70px_1fr] gap-x-2 gap-y-1 items-center">
                            <span className="text-gray-500">견적번호</span>
                            <EditableInput value={data.quotationNumber} onChange={(v) => setData({...data, quotationNumber: v})} className="font-medium" />
                            <span className="text-gray-500">견적일자</span>
                            <EditableInput type="date" value={data.date} onChange={(v) => setData({...data, date: v})} />
                            <span className="text-gray-500">유효기간</span>
                            <EditableInput type="date" value={data.validUntil} onChange={(v) => setData({...data, validUntil: v})} />
                            <span className="text-gray-500">결제조건</span>
                            <EditableInput value={data.paymentTerms} onChange={(v) => setData({...data, paymentTerms: v})} placeholder="결제조건" />
                          </div>
                          
                          {/* 수신처 */}
                          <div className="border-t pt-2">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-gray-500 w-14">수신</span>
                              <EditableInput 
                                value={data.client.name} 
                                onChange={(v) => setData({...data, client: {...data.client, name: v}})}
                                placeholder="수신처 (고객사명)"
                                className="text-sm font-bold flex-1"
                              />
                              <span className="text-sm">귀하</span>
                            </div>
                            <div className="grid grid-cols-[70px_1fr_70px_1fr] gap-x-2 gap-y-1 items-center">
                              <span className="text-gray-500">담당자</span>
                              <EditableInput value={data.client.ownerName} onChange={(v) => setData({...data, client: {...data.client, ownerName: v}})} placeholder="담당자" />
                              <span className="text-gray-500">부서</span>
                              <EditableInput value={data.client.department || ''} onChange={(v) => setData({...data, client: {...data.client, department: v}})} placeholder="부서/팀" />
                              <span className="text-gray-500">직책</span>
                              <EditableInput value={data.client.position || ''} onChange={(v) => setData({...data, client: {...data.client, position: v}})} placeholder="직책/직위" />
                              <span className="text-gray-500">연락처</span>
                              <EditableInput value={data.client.phone} onChange={(v) => setData({...data, client: {...data.client, phone: v}})} placeholder="연락처" />
                              <span className="text-gray-500">이메일</span>
                              <EditableInput value={data.client.email} onChange={(v) => setData({...data, client: {...data.client, email: v}})} placeholder="이메일" />
                              <span className="text-gray-500">납기조건</span>
                              <EditableInput value={data.deliveryTerms} onChange={(v) => setData({...data, deliveryTerms: v})} placeholder="납기조건" />
                            </div>
                          </div>
                        </div>

                        {/* 우측 영역: 공급자 + 담당자 */}
                        <div className="w-[200px] border border-gray-300 rounded p-2 text-xs flex-shrink-0">
                          <div className="flex items-center justify-between border-b pb-1 mb-1">
                            <span className="font-bold">공급자</span>
                            {bannerSettings.stampImage && (
                              <img src={bannerSettings.stampImage} alt="직인" className="w-8 h-8 object-contain" />
                            )}
                          </div>
                          <div className="grid grid-cols-[45px_1fr] gap-y-0.5 items-center">
                            <span className="text-gray-400">상호</span>
                            <EditableInput value={data.supplier.name} onChange={(v) => setData({...data, supplier: {...data.supplier, name: v}})} />
                            <span className="text-gray-400">등록번호</span>
                            <EditableInput value={data.supplier.registrationNumber} onChange={(v) => setData({...data, supplier: {...data.supplier, registrationNumber: v}})} />
                            <span className="text-gray-400">대표자</span>
                            <EditableInput value={data.supplier.ownerName} onChange={(v) => setData({...data, supplier: {...data.supplier, ownerName: v}})} />
                            <span className="text-gray-400">연락처</span>
                            <EditableInput value={data.supplier.phone} onChange={(v) => setData({...data, supplier: {...data.supplier, phone: v}})} />
                          </div>
                          {/* 담당자 정보 (한 줄로) */}
                          {(userInfo.name || userInfo.mobile) && (
                            <div className="border-t mt-1 pt-1 text-gray-600">
                              <span className="text-gray-400">담당: </span>
                              {userInfo.name}{userInfo.position && ` (${userInfo.position})`}
                              {userInfo.mobile && ` ${userInfo.mobile}`}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">아래와 같이 견적합니다.</p>
                    </>
                  )}

                  {!page.isFirst && (
                    <div style={{ height: `${SECTION_HEIGHTS.HEADER_NEXT}mm` }} />
                  )}

                  {/* [Section] Line Items & Calculation */}
                  <div className="relative overflow-y-hidden">
                    <table className="w-full border-collapse border border-black mb-2 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-2 w-12">No</th>
                          <th className="border border-black p-2">품명</th>
                          <th className="border border-black p-2 w-20">규격</th>
                          <th className="border border-black p-2 w-16">단위</th>
                          <th className="border border-black p-2 w-20">수량</th>
                          <th className="border border-black p-2 w-28">단가</th>
                          <th className="border border-black p-2 w-32">공급가액</th>
                          <th className="border border-black p-2 w-24">비고</th>
                          <th className="border border-black p-1 w-8 print:hidden bg-white border-l-0" data-html2canvas-ignore></th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.items.map((row) => {
                          if (row.type === 'subtotal') {
                            return (
                              <tr key="subtotal" className="bg-gray-50">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold">소 계</td>
                                <td className="border border-black p-2 text-right font-bold">{data.subtotal.toLocaleString()}</td>
                                <td className="border border-black p-2"></td>
                                <td className="border-0 print:hidden" data-html2canvas-ignore></td>
                              </tr>
                            );
                          }
                          if (row.type === 'vat') {
                            return (
                              <tr key="vat" className="bg-gray-50">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold">부 가 세</td>
                                <td className="border border-black p-2 text-right font-bold">{data.vat.toLocaleString()}</td>
                                <td className="border border-black p-2"></td>
                                <td className="border-0 print:hidden" data-html2canvas-ignore></td>
                              </tr>
                            );
                          }
                          if (row.type === 'total') {
                            return (
                              <tr key="total" className="bg-gray-100">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">총 합 계</td>
                                <td className="border border-black p-2 text-right font-bold text-lg text-blue-600">{data.total.toLocaleString()}</td>
                                <td className="border border-black p-2"></td>
                                <td className="border-0 print:hidden" data-html2canvas-ignore></td>
                              </tr>
                            );
                          }
                          
                          const item = row.data!;
                          const itemIndex = data.items.findIndex(i => i.id === item.id);
                          
                          return (
                          <tr key={item.id} className="group hover:bg-blue-50/30">
                            <td className="border border-black p-1 text-center bg-gray-50">
                              {itemIndex + 1}
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                value={item.name} 
                                onChange={(v) => handleItemChange(item.id, 'name', v)}
                                className="h-full px-2"
                              />
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                value={item.spec} 
                                onChange={(v) => handleItemChange(item.id, 'spec', v)}
                                align="center"
                                className="h-full px-1"
                              />
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                value={item.unit} 
                                onChange={(v) => handleItemChange(item.id, 'unit', v)}
                                align="center"
                                className="h-full px-1"
                              />
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                type="number"
                                value={item.quantity} 
                                onChange={(v) => handleItemChange(item.id, 'quantity', Number(v))}
                                align="right"
                                className="h-full px-2"
                              />
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                type="number"
                                value={item.unitPrice} 
                                onChange={(v) => handleItemChange(item.id, 'unitPrice', Number(v))}
                                align="right"
                                className="h-full px-2"
                              />
                            </td>
                            <td className="border border-black p-1 text-right font-medium bg-gray-50/50">
                              {item.amount.toLocaleString()}
                            </td>
                            <td className="border border-black p-0">
                              <EditableInput 
                                value={item.note} 
                                onChange={(v) => handleItemChange(item.id, 'note', v)}
                                className="h-full px-2"
                              />
                            </td>
                            <td className="border-0 p-0 text-center print:hidden align-middle" data-html2canvas-ignore>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {page.showButton && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addItem}
                        className="print:hidden mb-4 w-full border-dashed border-2 hover:bg-gray-50 text-gray-600"
                        data-html2canvas-ignore
                      >
                        <Plus className="w-4 h-4 mr-2" /> 품목 추가
                      </Button>
                    )}
                  </div>

                  {/* [Section] Remarks & Terms (Last Page Only) */}
                  {page.isLast ? (
                    <>
                      <div className="text-sm space-y-4 pt-2 flex-shrink-0 mt-2">
                        <div className="flex gap-4 items-start pt-2">
                          <span className="font-bold w-20 text-gray-700 mt-1">비고</span>
                          <EditableTextarea 
                            value={data.remarks} 
                            onChange={(v) => setData({...data, remarks: v})}
                            rows={3}
                            placeholder="특이사항이나 비고를 입력하세요"
                            className="flex-1 border border-gray-200 rounded p-2"
                          />
                        </div>
                      </div>
                      <div className="text-center text-gray-400 text-xs flex-shrink-0 mt-auto">
                        Generatred by BizOrder
                        {settings.showPageNumbers && <span className="ml-2">({pageIndex + 1} / {pages.length})</span>}
                      </div>
                    </>
                  ) : (
                    <div className="mt-auto text-center text-gray-400 text-sm border-t pt-4">
                      (다음 페이지에 계속)
                      {settings.showPageNumbers && <div className="text-xs mt-1">{pageIndex + 1} / {pages.length}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
