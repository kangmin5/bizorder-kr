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
  department?: string;
  position?: string;
  address: string;
  businessType: string;
  businessItem: string;
  email: string;
  phone: string;
  fax: string;
  stampImage?: string;
}

interface PurchaseOrderData {
  orderNumber: string;
  date: string;
  deliveryDate: string;
  orderer: CompanyInfo;      // 발주처 (우리)
  supplier: CompanyInfo;     // 공급자 (상대방)
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
type FontFamily = 'nanum-gothic' | 'nanum-myeongjo' | 'system';
type Currency = '원' | '천원' | 'USD';

type PageSettings = {
  paperSize: PaperSize;
  orientation: Orientation;
  theme: Theme;
  fontFamily: FontFamily;
  showPageNumbers: boolean;
  showSpecialTerms: boolean;
  currency: Currency;
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

const SECTION_HEIGHTS = {
  HEADER_FIRST: 60,
  HEADER_NEXT: 10,
  TABLE_HEADER: 10,
  ROW: 8,
  SUMMARY_ROW: 8,
  REMARKS_BASE: 25,
  REMARKS_LINE: 5,
  BUTTON: 10,
  FOOTER: 10
};

// --- Helper Components ---

const EditableInput = ({ 
  value, 
  onChange, 
  className, 
  placeholder, 
  type = "text",
  align = "left",
  multiline = false
}: { 
  value: string | number; 
  onChange: (val: string) => void; 
  className?: string;
  placeholder?: string;
  type?: string;
  align?: "left" | "center" | "right";
  multiline?: boolean;
}) => {
  if (multiline) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.textContent || '')}
        className={cn(
          "bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full transition-colors min-h-[1.5em] whitespace-pre-wrap break-words",
          align === "center" && "text-center",
          align === "right" && "text-right",
          className
        )}
        style={{ wordBreak: 'break-word' }}
      >
        {value || placeholder}
      </div>
    );
  }
  return (
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
};

// 숫자 입력용 컴포넌트 - blur 시에만 포맷팅 적용
const NumberInput = ({ 
  value, 
  onChange, 
  className, 
  decimalPlaces = 0,
  align = "right" 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  className?: string;
  decimalPlaces?: number;
  align?: "left" | "center" | "right";
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      const formatted = value.toLocaleString('ko-KR', { 
        minimumFractionDigits: decimalPlaces, 
        maximumFractionDigits: decimalPlaces 
      });
      setLocalValue(formatted);
    }
  }, [value, decimalPlaces, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(String(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const num = localValue.replace(/[^0-9.]/g, '');
    const parsed = num ? parseFloat(num) : 0;
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;
    setLocalValue(sanitized);
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full transition-colors",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    />
  );
};

const EditableTextarea = ({ 
  value, 
  onChange, 
  className, 
  placeholder,
  rows = 3
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
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
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

export function PurchaseOrderPage() {
  const { companyInfo, userInfo, bannerSettings } = useSettingsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const [settings, setSettings] = useState<PageSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    theme: 'classic',
    fontFamily: 'nanum-gothic',
    showPageNumbers: true,
    showSpecialTerms: true,
    currency: '원',
    margins: 10,
  });

  // 숫자 계산 설정
  const [calcSettings, setCalcSettings] = useState({
    priceDecimalPlaces: 0 as 0 | 1 | 2,
    priceRounding: 'round' as 'round' | 'floor' | 'ceil',
    vatRounding: 'round' as 'round' | 'floor' | 'ceil',
  });

  // 컬럼 너비 상태 (퍼센트)
  const [colWidths, setColWidths] = useState({
    no: 4,
    name: 34,
    spec: 13,
    unit: 6,
    qty: 8,
    price: 12,
    amount: 13,
    note: 10,
  });

  // 컬럼 리사이즈 핸들러
  const handleColumnResize = (column: keyof typeof colWidths, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      const tableWidth = 680;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / tableWidth) * 100;
      const newWidth = Math.max(2, Math.min(50, startWidth + deltaPercent));
      setColWidths(prev => ({ ...prev, [column]: newWidth }));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const [data, setData] = useState<PurchaseOrderData>(() => ({
    orderNumber: `PO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderer: {
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
    supplier: {
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
    paymentTerms: '월말 정산',
    deliveryTerms: '발주 후 2주 이내',
  }));

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calculateTotals();
  }, [data.items, data.vatIncluded, calcSettings.vatRounding]);

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => {
      if (item.id === id) {
        let newValue = value;
        if (field === 'unitPrice' && typeof value === 'number') {
          newValue = applyRounding(value, calcSettings.priceRounding, calcSettings.priceDecimalPlaces);
        }
        const updatedItem = { ...item, [field]: newValue };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.amount = Math.round(updatedItem.quantity * updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    });
    setData({ ...data, items: newItems });
  };

  // 특정 인덱스 뒤에 항목 삽입
  const insertItemAfter = (index: number) => {
    const newItem = { ...INITIAL_ITEM, id: Math.random().toString(36).substr(2, 9) };
    const newItems = [...data.items];
    newItems.splice(index + 1, 0, newItem);
    setData({ ...data, items: newItems });
  };

  const removeItem = (id: string) => {
    if (data.items.length <= 1) return;
    setData({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  // 사업자등록번호 포맷팅
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 10);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
  };

  // 숫자 포맷팅
  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('ko-KR');
  };

  // 포맷된 문자열에서 숫자 추출
  const parseNumber = (value: string): number => {
    const num = value.replace(/[^0-9]/g, '');
    return num ? parseFloat(num) : 0;
  };

  // 반올림 함수
  const applyRounding = (value: number, method: 'round' | 'floor' | 'ceil', decimalPlaces: number = 0) => {
    const multiplier = Math.pow(10, decimalPlaces);
    switch (method) {
      case 'floor': return Math.floor(value * multiplier) / multiplier;
      case 'ceil': return Math.ceil(value * multiplier) / multiplier;
      default: return Math.round(value * multiplier) / multiplier;
    }
  };

  const calculateTotals = () => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const rawVat = data.vatIncluded ? 0 : subtotal * 0.1;
    const vat = applyRounding(rawVat, calcSettings.vatRounding, 0);
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
      const { width, height } = getPaperDimensions();
      const pdf = new jsPDF({ orientation: settings.orientation, unit: 'mm', format: [width, height] });
      const pages = printRef.current.querySelectorAll('.page-break');
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      }
      pdf.save(`발주서_${data.orderNumber}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const wsData = [
      ['발주서'],
      ['발주번호', data.orderNumber, '발주일자', data.date],
      ['납기요청일', data.deliveryDate],
      [],
      ['No', '품명', '규격', '단위', '수량', '단가', '공급가액', '비고'],
      ...data.items.map((item, idx) => [
        idx + 1, item.name, item.spec, item.unit, item.quantity, item.unitPrice, item.amount, item.note
      ]),
      [],
      ['', '', '', '', '', '소계', data.subtotal],
      ['', '', '', '', '', '부가세', data.vat],
      ['', '', '', '', '', '합계', data.total],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '발주서');
    XLSX.writeFile(wb, `발주서_${data.orderNumber}.xlsx`);
  };

  const getFontStyle = () => {
    switch (settings.fontFamily) {
      case 'nanum-gothic': return "font-['Nanum_Gothic',sans-serif]";
      case 'nanum-myeongjo': return "font-['Nanum_Myeongjo',serif]";
      default: return 'font-sans';
    }
  };

  const renderThemeStyles = () => {
    const fontClass = getFontStyle();
    switch (settings.theme) {
      case 'modern': return `bg-white border-l-4 border-blue-500 ${fontClass}`;
      case 'minimal': return `bg-white grayscale ${fontClass}`;
      case 'bold': return `bg-slate-50 font-bold border-4 border-black ${fontClass}`;
      case 'blue': return `bg-blue-50 text-blue-900 ${fontClass}`;
      case 'dark': return `bg-slate-800 text-white ${fontClass}`;
      default: return `bg-white border border-gray-200 ${fontClass}`;
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
          <Button variant="outline" size="icon" onClick={toggleSidebar}>
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">발주서 작성</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 text-sm">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setZoom(Math.max(50, zoom - 10))}>-</Button>
            <span className="w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setZoom(Math.min(200, zoom + 10))}>+</Button>
          </div>
          {pages.length > 1 && (
            <div className="flex items-center gap-1 bg-blue-50 rounded-lg px-2 py-1 text-sm">
              <span className="text-gray-500 text-xs mr-1">페이지:</span>
              {pages.map((_, idx) => (
                <Button key={idx} variant={idx === 0 ? "default" : "outline"} size="sm" className="h-6 w-6 p-0 text-xs"
                  onClick={() => document.getElementById(`po-page-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  {idx + 1}
                </Button>
              ))}
              <span className="text-gray-400 text-xs ml-1">/ {pages.length}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> 인쇄</Button>
          <Button variant="outline" onClick={handleExportExcel}><FileSpreadsheet className="w-4 h-4 mr-2" /> 엑셀</Button>
          <Button onClick={handleExportPDF} disabled={isLoading}><Download className="w-4 h-4 mr-2" /> {isLoading ? '생성 중...' : 'PDF'}</Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel ref={sidebarRef} defaultSize={25} minSize={20} maxSize={40} collapsible={true}
          onCollapse={() => setIsSidebarOpen(false)} onExpand={() => setIsSidebarOpen(true)}
          className={cn("bg-gray-50 border-r", !isSidebarOpen && "min-w-[0px] border-none")}>
          <div className="h-full overflow-auto">
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Settings2 className="w-5 h-5" /> 문서 설정
              </div>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">스타일 & 레이아웃</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>용지 크기</Label>
                    <Select value={settings.paperSize} onValueChange={(v) => setSettings({...settings, paperSize: v as PaperSize})}>
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
                    <Select value={settings.orientation} onValueChange={(v) => setSettings({...settings, orientation: v as Orientation})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">세로 (Portrait)</SelectItem>
                        <SelectItem value="landscape">가로 (Landscape)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>테마 선택</Label>
                    <Select value={settings.theme} onValueChange={(v: Theme) => setSettings({...settings, theme: v})}>
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
                  <div className="space-y-2">
                    <Label>폰트 선택</Label>
                    <Select value={settings.fontFamily} onValueChange={(v) => setSettings({...settings, fontFamily: v as FontFamily})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nanum-gothic">나눔고딕</SelectItem>
                        <SelectItem value="nanum-myeongjo">나눔명조</SelectItem>
                        <SelectItem value="system">시스템 기본</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">옵션</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="vat" checked={!data.vatIncluded} onCheckedChange={(c) => setData({...data, vatIncluded: !c})} />
                    <Label htmlFor="vat">부가세 별도 단가 적용</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="page-num" checked={settings.showPageNumbers} onCheckedChange={(c) => setSettings({...settings, showPageNumbers: !!c})} />
                    <Label htmlFor="page-num">페이지 번호 표시</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="special-terms" checked={settings.showSpecialTerms} onCheckedChange={(c) => setSettings({...settings, showSpecialTerms: !!c})} />
                    <Label htmlFor="special-terms">특수조건 표시</Label>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-gray-600">통화 단위</Label>
                    <Select value={settings.currency} onValueChange={(v: Currency) => setSettings({...settings, currency: v})}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="원">원 (KRW)</SelectItem>
                        <SelectItem value="천원">천원</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">숫자 계산 설정</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">단가 소수점 자리</Label>
                    <Select value={String(calcSettings.priceDecimalPlaces)} onValueChange={(v) => setCalcSettings({...calcSettings, priceDecimalPlaces: Number(v) as 0 | 1 | 2})}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">정수 (소수점 없음)</SelectItem>
                        <SelectItem value="1">소수점 1자리</SelectItem>
                        <SelectItem value="2">소수점 2자리</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">단가 반올림 방식</Label>
                    <Select value={calcSettings.priceRounding} onValueChange={(v: 'round' | 'floor' | 'ceil') => setCalcSettings({...calcSettings, priceRounding: v})}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">반올림</SelectItem>
                        <SelectItem value="floor">내림 (버림)</SelectItem>
                        <SelectItem value="ceil">올림</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">부가세 반올림 방식</Label>
                    <Select value={calcSettings.vatRounding} onValueChange={(v: 'round' | 'floor' | 'ceil') => setCalcSettings({...calcSettings, vatRounding: v})}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">반올림</SelectItem>
                        <SelectItem value="floor">내림 (버림)</SelectItem>
                        <SelectItem value="ceil">올림</SelectItem>
                      </SelectContent>
                    </Select>
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
                <div key={pageIndex} id={`po-page-${pageIndex}`}
                  className={cn("shadow-lg transition-all duration-300 p-[10mm] box-border relative bg-white flex flex-col page-break", renderThemeStyles())}
                  style={{ width: `${getPaperDimensions().width}mm`, height: `${getPaperDimensions().height}mm`, transform: `scale(${zoom / 100})`, transformOrigin: 'top center', marginBottom: '2rem' }}>
                  
                  {page.isFirst && (
                    <>
                      {bannerSettings.bannerImage && bannerSettings.position === 'top' && (
                        <div className="mb-2 flex justify-center">
                          <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-12 object-contain" />
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                        <div className="flex items-center gap-3">
                          {bannerSettings.bannerImage && bannerSettings.position === 'left' && (
                            <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                          )}
                          <h1 className="text-3xl font-bold tracking-widest">발 주 서</h1>
                          {bannerSettings.bannerImage && bannerSettings.position === 'right' && (
                            <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                          )}
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {data.total.toLocaleString()} {settings.currency} <span className="text-sm text-black font-normal">(VAT 포함)</span>
                        </p>
                      </div>

                      <div className="flex gap-4 mb-3 text-xs">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-[70px_1fr_70px_1fr] gap-x-2 gap-y-1 items-center">
                            <span className="text-gray-500">발주번호</span>
                            <EditableInput value={data.orderNumber} onChange={(v) => setData({...data, orderNumber: v})} className="font-medium" />
                            <span className="text-gray-500">발주일자</span>
                            <EditableInput type="date" value={data.date} onChange={(v) => setData({...data, date: v})} />
                            <span className="text-gray-500">납기요청</span>
                            <EditableInput type="date" value={data.deliveryDate} onChange={(v) => setData({...data, deliveryDate: v})} />
                            <span className="text-gray-500">결제조건</span>
                            <EditableInput value={data.paymentTerms} onChange={(v) => setData({...data, paymentTerms: v})} placeholder="결제조건" />
                          </div>
                          
                          <div className="border-t pt-2">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-gray-500 w-14">수신</span>
                              <EditableInput value={data.supplier.name} onChange={(v) => setData({...data, supplier: {...data.supplier, name: v}})} placeholder="공급자 (회사명)" className="text-sm font-bold flex-1" />
                              <span className="text-sm">귀하</span>
                            </div>
                            <div className="grid grid-cols-[70px_1fr_70px_1fr] gap-x-2 gap-y-1 items-center">
                              <span className="text-gray-500">담당자</span>
                              <EditableInput value={data.supplier.ownerName} onChange={(v) => setData({...data, supplier: {...data.supplier, ownerName: v}})} placeholder="담당자" />
                              <span className="text-gray-500">부서</span>
                              <EditableInput value={data.supplier.department || ''} onChange={(v) => setData({...data, supplier: {...data.supplier, department: v}})} placeholder="부서/팀" />
                              <span className="text-gray-500">직책</span>
                              <EditableInput value={data.supplier.position || ''} onChange={(v) => setData({...data, supplier: {...data.supplier, position: v}})} placeholder="직책/직위" />
                              <span className="text-gray-500">연락처</span>
                              <EditableInput value={data.supplier.phone} onChange={(v) => setData({...data, supplier: {...data.supplier, phone: v}})} placeholder="연락처" />
                              <span className="text-gray-500">이메일</span>
                              <EditableInput value={data.supplier.email} onChange={(v) => setData({...data, supplier: {...data.supplier, email: v}})} placeholder="이메일" />
                              <span className="text-gray-500">납품장소</span>
                              <EditableInput value={data.deliveryTerms} onChange={(v) => setData({...data, deliveryTerms: v})} placeholder="납품장소" />
                            </div>
                          </div>
                        </div>

                        <div className="w-[200px] border border-gray-300 rounded p-2 text-xs flex-shrink-0">
                          <div className="flex items-center justify-between border-b pb-1 mb-1">
                            <span className="font-bold">발주처</span>
                            {bannerSettings.stampImage && <img src={bannerSettings.stampImage} alt="직인" className="w-8 h-8 object-contain" />}
                          </div>
                          <div className="grid grid-cols-[45px_1fr] gap-y-0.5 items-center">
                            <span className="text-gray-400">상호</span>
                            <EditableInput value={data.orderer.name} onChange={(v) => setData({...data, orderer: {...data.orderer, name: v}})} />
                            <span className="text-gray-400">등록번호</span>
                            <EditableInput value={data.orderer.registrationNumber} onChange={(v) => setData({...data, orderer: {...data.orderer, registrationNumber: formatBusinessNumber(v)}})} placeholder="000-00-00000" />
                            <span className="text-gray-400">대표자</span>
                            <EditableInput value={data.orderer.ownerName} onChange={(v) => setData({...data, orderer: {...data.orderer, ownerName: v}})} />
                            <span className="text-gray-400">연락처</span>
                            <EditableInput value={data.orderer.phone} onChange={(v) => setData({...data, orderer: {...data.orderer, phone: v}})} />
                          </div>
                          {(userInfo.name || userInfo.mobile) && (
                            <div className="border-t mt-1 pt-1 text-gray-600">
                              <span className="text-gray-400">담당: </span>
                              {userInfo.name}{userInfo.position && ` (${userInfo.position})`}
                              {userInfo.mobile && ` ${userInfo.mobile}`}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">아래와 같이 발주합니다.</p>
                    </>
                  )}

                  {!page.isFirst && <div style={{ height: `${SECTION_HEIGHTS.HEADER_NEXT}mm` }} />}

                  <div className="relative overflow-visible">
                    {page.isFirst && (
                      <div className="text-right text-xs text-gray-500 mb-1">(단위: {settings.currency})</div>
                    )}
                    <table className="w-full border-collapse border border-black mb-2 text-sm table-fixed" style={{ wordBreak: 'break-word' }}>
                      <colgroup>
                        <col style={{ width: `${colWidths.no}%` }} />
                        <col style={{ width: `${colWidths.name}%` }} />
                        <col style={{ width: `${colWidths.spec}%` }} />
                        <col style={{ width: `${colWidths.unit}%` }} />
                        <col style={{ width: `${colWidths.qty}%` }} />
                        <col style={{ width: `${colWidths.price}%` }} />
                        <col style={{ width: `${colWidths.amount}%` }} />
                        <col style={{ width: `${colWidths.note}%` }} />
                      </colgroup>
                      {page.isFirst && (
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black p-1.5 text-center relative">
                              No
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('no', e.clientX, colWidths.no)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              품명
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('name', e.clientX, colWidths.name)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              규격
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('spec', e.clientX, colWidths.spec)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              단위
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('unit', e.clientX, colWidths.unit)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              수량
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('qty', e.clientX, colWidths.qty)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              단가
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('price', e.clientX, colWidths.price)} />
                            </th>
                            <th className="border border-black p-1.5 text-center relative">
                              공급가액
                              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize('amount', e.clientX, colWidths.amount)} />
                            </th>
                            <th className="border border-black p-1.5 text-center">비고</th>
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {page.items.map((row) => {
                          if (row.type === 'subtotal') {
                            return (
                              <tr key="subtotal" className="bg-gray-50">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold">소 계</td>
                                <td colSpan={2} className="border border-black p-2 text-right font-bold">{data.subtotal.toLocaleString()} {settings.currency}</td>
                              </tr>
                            );
                          }
                          if (row.type === 'vat') {
                            return (
                              <tr key="vat" className="bg-gray-50">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold">부 가 세</td>
                                <td colSpan={2} className="border border-black p-2 text-right font-bold">{data.vat.toLocaleString()} {settings.currency}</td>
                              </tr>
                            );
                          }
                          if (row.type === 'total') {
                            return (
                              <tr key="total" className="bg-gray-100">
                                <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">총 합 계</td>
                                <td colSpan={2} className="border border-black p-2 text-right font-bold text-lg text-blue-600">{data.total.toLocaleString()} {settings.currency}</td>
                              </tr>
                            );
                          }
                          const item = row.data!;
                          const itemIndex = data.items.findIndex(i => i.id === item.id);
                          return (
                            <tr key={item.id} className="group hover:bg-blue-50/30 relative">
                              <td className="border border-black p-1 text-center bg-gray-50">{itemIndex + 1}</td>
                              <td className="border border-black p-0">
                                <EditableInput value={item.name} onChange={(v) => handleItemChange(item.id, 'name', v)} align="left" multiline className="h-full px-2" />
                              </td>
                              <td className="border border-black p-0">
                                <EditableInput value={item.spec} onChange={(v) => handleItemChange(item.id, 'spec', v)} align="left" multiline className="h-full px-1" />
                              </td>
                              <td className="border border-black p-0">
                                <EditableInput value={item.unit} onChange={(v) => handleItemChange(item.id, 'unit', v)} align="center" className="h-full px-1" />
                              </td>
                              <td className="border border-black p-0">
                                <EditableInput value={formatNumber(item.quantity)} onChange={(v) => handleItemChange(item.id, 'quantity', parseNumber(v))} align="center" className="h-full px-2" />
                              </td>
                              <td className="border border-black p-0">
                                <NumberInput value={item.unitPrice} onChange={(v) => handleItemChange(item.id, 'unitPrice', v)} decimalPlaces={calcSettings.priceDecimalPlaces} align="right" className="h-full px-2" />
                              </td>
                              <td className="border border-black p-1 text-right font-medium bg-gray-50/50">{item.amount.toLocaleString()}</td>
                              <td className="border border-black p-0 relative">
                                <EditableInput value={item.note} onChange={(v) => handleItemChange(item.id, 'note', v)} align="center" multiline className="h-full px-2" />
                                <div className="absolute left-full top-0 bottom-0 flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" data-html2canvas-ignore>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => insertItemAfter(itemIndex)} title="아래에 항목 추가">
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)} title="항목 삭제">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {page.isLast ? (
                    <>
                      {settings.showSpecialTerms && (
                        <div className="text-sm space-y-4 pt-2 flex-shrink-0 mt-2">
                          <div className="flex gap-4 items-start pt-2">
                            <span className="font-bold w-20 text-gray-700 mt-1">특수조건</span>
                            <EditableTextarea value={data.remarks} onChange={(v) => setData({...data, remarks: v})} rows={3} placeholder="특수조건을 입력하세요" className="flex-1 border border-gray-200 rounded p-2" />
                          </div>
                        </div>
                      )}
                      <div className="text-center text-gray-400 text-xs flex-shrink-0 mt-auto">
                        Generated by BizOrder
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
