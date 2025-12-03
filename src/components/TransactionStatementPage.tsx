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
  address: string;
  businessType: string;
  businessItem: string;
  email: string;
  phone: string;
  fax: string;
  stampImage?: string;
}

interface TransactionStatementData {
  statementNumber: string;
  date: string;
  supplier: CompanyInfo;
  client: CompanyInfo;
  items: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  vatIncluded: boolean;
  remarks: string;
}

type PaperSize = 'A4' | 'A3' | 'B5';
type Orientation = 'portrait' | 'landscape';
type Theme = 'classic' | 'modern' | 'minimal' | 'bold' | 'blue' | 'dark';

interface PageSettings {
  paperSize: PaperSize;
  orientation: Orientation;
  theme: Theme;
  showPageNumbers: boolean;
  margins: number; 
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

const PAGE_CAPACITY_FIRST = 16;
const PAGE_CAPACITY_NEXT = 28;

type PageItem = 
  | { type: 'item'; data: LineItem }
  | { type: 'subtotal' }
  | { type: 'vat' }
  | { type: 'total' };

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

export function TransactionStatementPage() {
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

  const [data, setData] = useState<TransactionStatementData>({
    statementNumber: `TS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    supplier: {
      name: '비즈오더 주식회사',
      registrationNumber: '123-45-67890',
      ownerName: '김대표',
      address: '서울시 강남구 테헤란로 123',
      businessType: '서비스',
      businessItem: '소프트웨어 개발',
      email: 'contact@bizorder.kr',
      phone: '02-1234-5678',
      fax: '02-1234-5679',
    },
    client: {
      name: '',
      registrationNumber: '',
      ownerName: '',
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
  });

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

      pdf.save(`${data.statementNumber}_거래명세서.pdf`);
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
      ['거래명세서'],
      ['일련번호', data.statementNumber],
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

    XLSX.utils.book_append_sheet(wb, ws, '거래명세서');
    XLSX.writeFile(wb, `${data.statementNumber}_거래명세서.xlsx`);
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

  const getPages = () => {
    const pages: { items: PageItem[]; isFirst: boolean; isLast: boolean }[] = [];
    
    // Create all rows including summary rows
    const allRows: PageItem[] = [
      ...data.items.map(item => ({ type: 'item' as const, data: item })),
      { type: 'subtotal' as const },
      { type: 'vat' as const },
      { type: 'total' as const }
    ];

    let remainingRows = [...allRows];
    
    // 1. Chunking logic
    // First page
    if (remainingRows.length > 0) {
      const chunk = remainingRows.splice(0, PAGE_CAPACITY_FIRST);
      pages.push({ items: chunk, isFirst: true, isLast: false });
    } else {
      pages.push({ items: [], isFirst: true, isLast: true });
      return pages;
    }

    // Subsequent pages
    while (remainingRows.length > 0) {
      const chunk = remainingRows.splice(0, PAGE_CAPACITY_NEXT);
      pages.push({ items: chunk, isFirst: false, isLast: false });
    }

    // 2. Remarks space check
    const lastPage = pages[pages.length - 1];
    
    // Calculate required space for remarks (dynamic)
    // Base cost: Button/Spacing(3) + Safety(1) = 4 items approx
    const remarksLines = (data.remarks.match(/\n/g) || []).length + 1;
    const remarksHeight = Math.max(3, remarksLines);
    const remarksCost = 4 + (remarksHeight * 0.5);

    const capacity = lastPage.isFirst ? PAGE_CAPACITY_FIRST : PAGE_CAPACITY_NEXT;
    
    if (lastPage.items.length + remarksCost > capacity) {
      // Not enough space for remarks, add a new empty page
      pages.push({ items: [], isFirst: false, isLast: true });
    } else {
      // Enough space
      lastPage.isLast = true;
    }

    return pages;
  };

  const pages = getPages();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={toggleSidebar} title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 열기"}>
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">거래명세서 작성</h1>
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
                    <Label htmlFor="vat">부가세 포함</Label>
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

        <ResizablePanel defaultSize={75} className="bg-slate-100">
          <div className="h-full overflow-auto">
            <div className="flex flex-col items-center p-8 min-w-[800px] gap-8" ref={printRef}>
              {pages.map((page, pageIndex) => (
                <div 
                  key={pageIndex}
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
                  {/* [Section] Document Header */}
                  {page.isFirst && (
                    <>
                      {/* [Section] Title Header & Document Meta */}
                      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                        <div className="w-1/2">
                          <h1 className="text-4xl font-bold tracking-widest mb-4">거 래 명 세 서</h1>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-16 text-gray-600">일련번호</span>
                              <EditableInput 
                                value={data.statementNumber} 
                                onChange={(v) => setData({...data, statementNumber: v})}
                                className="font-medium w-40"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-16 text-gray-600">거래일자</span>
                              <EditableInput 
                                type="date"
                                value={data.date} 
                                onChange={(v) => setData({...data, date: v})}
                                className="w-40"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-1/2 text-right">
                          <div className="mb-4 text-right">
                            <p className="text-2xl font-bold text-red-600 flex items-center justify-end gap-2">
                              {data.total.toLocaleString()} 원
                              <span className="text-sm text-black font-normal">(VAT 포함)</span>
                            </p>
                          </div>
                          <div className="border border-gray-300 p-4 rounded text-left text-sm ml-auto w-[320px]">
                            <p className="font-bold mb-2 text-center border-b pb-1">공급자</p>
                            <div className="grid grid-cols-[60px_1fr] gap-y-1 items-center">
                              <span className="text-gray-500">상호</span>
                              <EditableInput 
                                value={data.supplier.name} 
                                onChange={(v) => setData({...data, supplier: {...data.supplier, name: v}})}
                              />
                              <span className="text-gray-500">등록번호</span>
                              <EditableInput 
                                value={data.supplier.registrationNumber} 
                                onChange={(v) => setData({...data, supplier: {...data.supplier, registrationNumber: v}})}
                              />
                              <span className="text-gray-500">대표자</span>
                              <EditableInput 
                                value={data.supplier.ownerName} 
                                onChange={(v) => setData({...data, supplier: {...data.supplier, ownerName: v}})}
                              />
                              <span className="text-gray-500">주소</span>
                              <EditableInput 
                                value={data.supplier.address} 
                                onChange={(v) => setData({...data, supplier: {...data.supplier, address: v}})}
                              />
                              <span className="text-gray-500">연락처</span>
                              <EditableInput 
                                value={data.supplier.phone} 
                                onChange={(v) => setData({...data, supplier: {...data.supplier, phone: v}})}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* [Section] Client Info */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-2 border-b border-black pb-2 mb-4">
                          <EditableInput 
                            value={data.client.name} 
                            onChange={(v) => setData({...data, client: {...data.client, name: v}})}
                            placeholder="수신처 (고객사명)"
                            className="text-xl font-bold w-64"
                          />
                          <span className="text-lg">귀하</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 w-16">담당자</span>
                            <EditableInput 
                              value={data.client.ownerName} 
                              onChange={(v) => setData({...data, client: {...data.client, ownerName: v}})}
                              placeholder="담당자 성명"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 w-16">연락처</span>
                            <EditableInput 
                              value={data.client.phone} 
                              onChange={(v) => setData({...data, client: {...data.client, phone: v}})}
                              placeholder="담당자 연락처"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">아래와 같이 거래합니다.</p>
                      </div>
                    </>
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

                          const item = row.data;
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
                    
                    {pageIndex === pages.length - 1 && (
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
                      <div className="text-sm space-y-4 pt-8 flex-shrink-0 mt-8">
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

                      {/* [Section] Footer & Signature */}
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
