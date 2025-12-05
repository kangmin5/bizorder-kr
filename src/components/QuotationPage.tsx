import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Download,
  Settings2,
  PanelLeft,
  Save,
  FolderOpen,
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

import { useSettingsStore } from '../stores/useSettingsStore';
import { useDocumentStore } from '../stores/useDocumentStore';

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
type FontFamily = 'nanum-gothic' | 'nanum-myeongjo' | 'system';

type Currency = '원' | '천원' | 'USD';

type PageSettings = {
  paperSize: PaperSize;
  orientation: Orientation;
  theme: Theme;
  fontFamily: FontFamily;
  showPageNumbers: boolean;
  showSpecialTerms: boolean;  // 특수조건 표시 여부
  currency: Currency;  // 통화 단위
  margins: number; // mm
}

// 양식 템플릿 타입
type TemplateColumn = {
  key: string;
  label: string;
  width: number;
  type: 'text' | 'number' | 'currency';
  align?: 'left' | 'center' | 'right';
}

type QuotationTemplate = {
  id: string;
  name: string;
  title: string;
  description: string;
  columns: TemplateColumn[];
  defaultSpecialTerms?: string;
  defaultUnit?: string;
}

// --- Constants ---

// 양식 템플릿 정의
const QUOTATION_TEMPLATES: QuotationTemplate[] = [
  {
    id: 'standard',
    name: '일반 견적서',
    title: '견 적 서',
    description: '일반적인 상품/서비스 견적용',
    defaultUnit: 'EA',
    columns: [
      { key: 'no', label: 'No', width: 4, type: 'text', align: 'center' },
      { key: 'name', label: '품명', width: 30, type: 'text', align: 'left' },
      { key: 'spec', label: '규격', width: 13, type: 'text', align: 'left' },
      { key: 'unit', label: '단위', width: 6, type: 'text', align: 'center' },
      { key: 'quantity', label: '수량', width: 8, type: 'number', align: 'center' },
      { key: 'unitPrice', label: '단가', width: 12, type: 'currency', align: 'right' },
      { key: 'amount', label: '공급가액', width: 13, type: 'currency', align: 'right' },
      { key: 'note', label: '비고', width: 14, type: 'text', align: 'center' },
    ],
  },
  {
    id: 'maintenance',
    name: '유지보수 견적서',
    title: '유지보수 견적서',
    description: 'IT 시스템 유지보수 계약용',
    defaultUnit: 'M/M',
    defaultSpecialTerms: '기간: 2025년 01월 01일 ~ 2025년 12월 31일',
    columns: [
      { key: 'no', label: 'No', width: 5, type: 'text', align: 'center' },
      { key: 'name', label: '품명', width: 40, type: 'text', align: 'left' },
      { key: 'unit', label: '단위(M/M)', width: 10, type: 'text', align: 'center' },
      { key: 'quantity', label: '개월', width: 10, type: 'number', align: 'center' },
      { key: 'unitPrice', label: '월단가', width: 15, type: 'currency', align: 'right' },
      { key: 'amount', label: '공급가액', width: 20, type: 'currency', align: 'right' },
    ],
  },
  {
    id: 'construction',
    name: '건설용 견적서',
    title: '공 사 견 적 서',
    description: '건설/공사 견적용 (A3 가로 권장)',
    defaultUnit: '식',
    columns: [
      { key: 'no', label: 'No', width: 3, type: 'text', align: 'center' },
      { key: 'name', label: '공종/품명', width: 20, type: 'text', align: 'left' },
      { key: 'spec', label: '규격', width: 12, type: 'text', align: 'left' },
      { key: 'unit', label: '단위', width: 5, type: 'text', align: 'center' },
      { key: 'quantity', label: '수량', width: 7, type: 'number', align: 'center' },
      { key: 'materialCost', label: '재료비', width: 11, type: 'currency', align: 'right' },
      { key: 'laborCost', label: '노무비', width: 11, type: 'currency', align: 'right' },
      { key: 'expense', label: '경비', width: 10, type: 'currency', align: 'right' },
      { key: 'amount', label: '합계', width: 11, type: 'currency', align: 'right' },
      { key: 'note', label: '비고', width: 10, type: 'text', align: 'center' },
    ],
  },
];

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

  // 외부 value가 변경되고 포커스가 없을 때만 로컬 값 업데이트
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
    // 포커스 시 콤마 제거하고 순수 숫자만 표시
    setLocalValue(String(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
    // blur 시 숫자로 변환하여 onChange 호출
    const num = localValue.replace(/[^0-9.]/g, '');
    const parsed = num ? parseFloat(num) : 0;
    onChange(parsed);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 소수점만 허용
    const filtered = e.target.value.replace(/[^0-9.]/g, '');
    // 소수점이 두 개 이상이면 첫 번째만 유지
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentId = searchParams.get('id');
  
  // 설정 스토어에서 값 가져오기
  const { companyInfo, userInfo, bannerSettings } = useSettingsStore();
  
  // 문서 저장 스토어
  const { 
    currentDocumentId,
    isModified,
    saveDocument, 
    loadDocument,
    setCurrentDocument,
    setModified
  } = useDocumentStore();

  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef<ImperativePanelHandle>(null);
  
  // 양식 선택 상태
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate>(QUOTATION_TEMPLATES[0]);
  
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
    priceDecimalPlaces: 0 as 0 | 1 | 2,  // 단가 소수점 자리: 0, 1, 2
    priceRounding: 'round' as 'round' | 'floor' | 'ceil',  // 단가 반올림 방식
    vatRounding: 'round' as 'round' | 'floor' | 'ceil',  // 부가세 반올림 방식
  });

  // 컬럼 너비 상태 (퍼센트) - 양식별로 동적으로 관리
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    QUOTATION_TEMPLATES[0].columns.forEach(col => {
      widths[col.key] = col.width;
    });
    return widths;
  });

  // 양식 변경 시 컬럼 너비 초기화
  useEffect(() => {
    const widths: Record<string, number> = {};
    selectedTemplate.columns.forEach(col => {
      widths[col.key] = col.width;
    });
    setColWidths(widths);
  }, [selectedTemplate]);

  // 컬럼 리사이즈 핸들러
  const handleColumnResize = (columnKey: string, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      const tableWidth = 680; // 대략적인 테이블 픽셀 너비
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / tableWidth) * 100;
      const newWidth = Math.max(3, Math.min(50, startWidth + deltaPercent));
      setColWidths(prev => ({ ...prev, [columnKey]: newWidth }));
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

  // 문서 불러오기 (URL에 id가 있으면)
  useEffect(() => {
    if (documentId) {
      loadDocument(documentId).then(doc => {
        if (doc && doc.data) {
          setData(doc.data);
        }
      });
    } else {
      // 새 문서 - 현재 문서 초기화
      setCurrentDocument(null);
    }
  }, [documentId, loadDocument, setCurrentDocument]);

  // 데이터 변경 시 수정됨 표시
  useEffect(() => {
    if (currentDocumentId) {
      setModified(true);
    }
  }, [data]);

  // 문서 저장 핸들러
  const handleSaveDocument = async () => {
    const title = data.client.name 
      ? `${data.client.name} 견적서` 
      : `견적서 ${data.quotationNumber}`;
    
    try {
      const docId = await saveDocument({
        id: currentDocumentId || undefined,
        type: 'quotation',
        title,
        clientName: data.client.name || '(미지정)',
        total: data.total,
        itemCount: data.items.length,
        data: data,
      });
      
      // URL에 문서 ID 추가 (새 문서인 경우)
      if (!currentDocumentId) {
        navigate(`/quotation?id=${docId}`, { replace: true });
      }
      
      alert('문서가 저장되었습니다.');
    } catch (error) {
      alert('저장에 실패했습니다.');
    }
  };

  useEffect(() => {
    calculateTotals();
  }, [data.items, data.vatIncluded, calcSettings.vatRounding]);

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => {
      if (item.id === id) {
        let newValue = value;
        // 단가에 반올림 적용
        if (field === 'unitPrice' && typeof value === 'number') {
          newValue = applyRounding(value, calcSettings.priceRounding, calcSettings.priceDecimalPlaces);
        }
        const updatedItem = { ...item, [field]: newValue };
        if (field === 'quantity' || field === 'unitPrice') {
          // 금액 계산 (정수로 반올림)
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
    if (data.items.length <= 1) return; // 최소 1개 항목 유지
    setData({ ...data, items: data.items.filter(item => item.id !== id) });
  };

  // 사업자등록번호 포맷팅 (###-##-#####)
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '').slice(0, 10);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
  };

  // 숫자 포맷팅 (3자리 콤마, 소수점 지원)
  const formatNumber = (value: string | number, decimalPlaces?: number): string => {
    const num = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    const dp = decimalPlaces ?? 0;
    return num.toLocaleString('ko-KR', { minimumFractionDigits: dp, maximumFractionDigits: dp });
  };

  // 포맷된 문자열에서 숫자 추출 (소수점 지원)
  const parseNumber = (value: string, allowDecimal: boolean = false): number => {
    const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    const num = value.replace(pattern, '');
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

  // 단순화: 페이지 분할 없이 단일 연속 문서로 렌더링
  // 인쇄/PDF 시 CSS @page로 자동 페이지 나눔

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={toggleSidebar} title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 열기"}>
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">
            견적서 작성
            {isModified && <span className="ml-2 text-sm text-orange-500">●</span>}
          </h1>
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
          <Button variant="outline" onClick={() => navigate('/documents')}>
            <FolderOpen className="w-4 h-4 mr-2" /> 문서함
          </Button>
          <Button variant="outline" onClick={handleSaveDocument}>
            <Save className="w-4 h-4 mr-2" /> 저장
          </Button>
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
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <Settings2 className="w-4 h-4" />
                문서 설정
              </div>

              {/* 견적서 양식 선택 */}
              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">📋 견적서 양식</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-1">
                  <Select 
                    value={selectedTemplate.id} 
                    onValueChange={(v) => {
                      const template = QUOTATION_TEMPLATES.find(t => t.id === v);
                      if (template) {
                        setSelectedTemplate(template);
                        setData(prev => ({ ...prev, remarks: template.defaultSpecialTerms || '' }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="양식을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTATION_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">스타일 & 레이아웃</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {/* 2열 그리드 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">용지</Label>
                      <Select value={settings.paperSize} onValueChange={(v: PaperSize) => setSettings({...settings, paperSize: v})}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="B5">B5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">방향</Label>
                      <Select value={settings.orientation} onValueChange={(v: Orientation) => setSettings({...settings, orientation: v})}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">세로</SelectItem>
                          <SelectItem value="landscape">가로</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">테마</Label>
                      <Select value={settings.theme} onValueChange={(v: Theme) => setSettings({...settings, theme: v})}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">클래식</SelectItem>
                          <SelectItem value="modern">모던</SelectItem>
                          <SelectItem value="minimal">미니멀</SelectItem>
                          <SelectItem value="bold">볼드</SelectItem>
                          <SelectItem value="blue">블루</SelectItem>
                          <SelectItem value="dark">다크</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">폰트</Label>
                      <Select value={settings.fontFamily} onValueChange={(v: FontFamily) => setSettings({...settings, fontFamily: v})}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nanum-gothic">나눔고딕</SelectItem>
                          <SelectItem value="nanum-myeongjo">나눔명조</SelectItem>
                          <SelectItem value="system">시스템</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">옵션</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="vat" checked={!data.vatIncluded} onCheckedChange={(c) => setData({...data, vatIncluded: !c})} />
                    <Label htmlFor="vat" className="text-xs">부가세 별도</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="page-num" checked={settings.showPageNumbers} onCheckedChange={(c) => setSettings({...settings, showPageNumbers: !!c})} />
                    <Label htmlFor="page-num" className="text-xs">페이지 번호</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="special-terms" checked={settings.showSpecialTerms} onCheckedChange={(c) => setSettings({...settings, showSpecialTerms: !!c})} />
                    <Label htmlFor="special-terms" className="text-xs">특수조건 표시</Label>
                  </div>
                  <div className="pt-1">
                    <Label className="text-xs text-gray-500">통화</Label>
                    <Select value={settings.currency} onValueChange={(v: Currency) => setSettings({...settings, currency: v})}>
                      <SelectTrigger className="h-7 mt-1"><SelectValue /></SelectTrigger>
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
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm">숫자 계산</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 space-y-2">
                  {/* 단가 설정 - 2열 그리드 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">단가 소수점</Label>
                      <Select value={String(calcSettings.priceDecimalPlaces)} onValueChange={(v) => setCalcSettings({...calcSettings, priceDecimalPlaces: Number(v) as 0 | 1 | 2})}>
                        <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">정수</SelectItem>
                          <SelectItem value="1">1자리</SelectItem>
                          <SelectItem value="2">2자리</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">단가 반올림</Label>
                      <Select value={calcSettings.priceRounding} onValueChange={(v: 'round' | 'floor' | 'ceil') => setCalcSettings({...calcSettings, priceRounding: v})}>
                        <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">반올림</SelectItem>
                          <SelectItem value="floor">내림</SelectItem>
                          <SelectItem value="ceil">올림</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">부가세 반올림</Label>
                    <Select value={calcSettings.vatRounding} onValueChange={(v: 'round' | 'floor' | 'ceil') => setCalcSettings({...calcSettings, vatRounding: v})}>
                      <SelectTrigger className="h-7"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">반올림</SelectItem>
                        <SelectItem value="floor">내림</SelectItem>
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

        {/* Right Main: WYSIWYG Editor */}
        <ResizablePanel defaultSize={75} className="bg-slate-100">
          <div className="h-full overflow-auto">
            <div className="flex flex-col items-center p-8 min-w-[800px]" ref={printRef}>
              {/* 단일 연속 문서 - 콘텐츠에 따라 자동 확장 */}
              <div 
                className={cn(
                  "shadow-lg transition-all duration-300 p-[10mm] box-border relative bg-white flex flex-col",
                  renderThemeStyles()
                )}
                style={{
                  width: `${getPaperDimensions().width}mm`,
                  minHeight: `${getPaperDimensions().height}mm`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* [Section] Document Header */}
                {/* 배너 이미지 - 상단 (2800x300px 비율) */}
                {bannerSettings.bannerImage && bannerSettings.position === 'top' && (
                  <div className="-mt-[10mm] -mx-[10mm] mb-4">
                    <img src={bannerSettings.bannerImage} alt="회사 배너" className="w-full h-auto object-cover" style={{ aspectRatio: '2800/300' }} />
                  </div>
                )}

                {/* 제목 + 총금액 라인 */}
                <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
                  <div className="flex items-center gap-3">
                    {bannerSettings.bannerImage && bannerSettings.position === 'left' && (
                      <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                    )}
                    <h1 className="text-3xl font-bold tracking-widest">{selectedTemplate.title}</h1>
                    {bannerSettings.bannerImage && bannerSettings.position === 'right' && (
                      <img src={bannerSettings.bannerImage} alt="회사 배너" className="max-h-10 object-contain" />
                    )}
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {data.total.toLocaleString()} {settings.currency} <span className="text-sm text-black font-normal">(VAT 포함)</span>
                  </p>
                </div>

                {/* 좌측: 메타+수신처 / 우측: 공급자+담당자 */}
                <div className="flex gap-4 mb-3 text-sm">
                  {/* 좌측 영역 */}
                  <div className="flex-1 space-y-2">
                    {/* 메타데이터 */}
                    <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-3 gap-y-1.5 items-center">
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
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-gray-500 w-12">수신</span>
                        <EditableInput 
                          value={data.client.name} 
                          onChange={(v) => setData({...data, client: {...data.client, name: v}})}
                          placeholder="수신처 (고객사명)"
                          className="text-base font-bold flex-1"
                        />
                        <span className="text-base">귀하</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-3 gap-y-1.5 items-center">
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
                  <div className="w-[230px] border border-gray-300 rounded p-2 text-sm flex-shrink-0">
                    <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                      <span className="font-bold">공급자</span>
                      {bannerSettings.stampImage && (
                        <img src={bannerSettings.stampImage} alt="직인" className="w-10 h-10 object-contain" />
                      )}
                    </div>
                    <div className="grid grid-cols-[55px_1fr] gap-x-2 gap-y-1 items-center">
                      <span className="text-gray-400">상호</span>
                      <EditableInput value={data.supplier.name} onChange={(v) => setData({...data, supplier: {...data.supplier, name: v}})} />
                      <span className="text-gray-400 whitespace-nowrap">사업자번호</span>
                      <EditableInput value={formatBusinessNumber(data.supplier.registrationNumber)} onChange={(v) => setData({...data, supplier: {...data.supplier, registrationNumber: v.replace(/-/g, '')}})} className="whitespace-nowrap" placeholder="000-00-00000" />
                      <span className="text-gray-400">대표자</span>
                      <EditableInput value={data.supplier.ownerName} onChange={(v) => setData({...data, supplier: {...data.supplier, ownerName: v}})} />
                      <span className="text-gray-400">연락처</span>
                      <EditableInput value={data.supplier.phone} onChange={(v) => setData({...data, supplier: {...data.supplier, phone: v}})} />
                    </div>
                    {/* 담당자 정보 */}
                    {(userInfo.name || userInfo.mobile || userInfo.email) && (
                      <div className="border-t mt-1.5 pt-1.5 text-gray-600 text-xs">
                        <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-0.5 items-center">
                          <span className="text-gray-400">담당</span>
                          <span>{userInfo.name}{userInfo.position && ` (${userInfo.position})`}</span>
                          {userInfo.mobile && <><span className="text-gray-400">연락처</span><span>{userInfo.mobile}</span></>}
                          {userInfo.email && <><span className="text-gray-400">이메일</span><span>{userInfo.email}</span></>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">아래와 같이 견적합니다.</p>

                {/* [Section] Line Items & Calculation */}
                <div className="relative overflow-visible flex-1">
                  {/* 통화 단위 표시 */}
                  <div className="text-right text-xs text-gray-500 mb-1">(단위: {settings.currency})</div>
                  
                  {/* 메인 테이블 */}
                  <table className="w-full border-collapse border border-black mb-2 text-sm table-fixed" style={{ wordBreak: 'break-word' }}>
                    <colgroup>
                      {selectedTemplate.columns.map((col) => (
                        <col key={col.key} style={{ width: `${colWidths[col.key] || col.width}%` }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-100">
                        {selectedTemplate.columns.map((col, idx) => (
                          <th key={col.key} className="border border-black p-1.5 text-center relative">
                            {col.label}
                            {idx < selectedTemplate.columns.length - 1 && (
                              <div 
                                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 print:hidden"
                                onMouseDown={(e) => handleColumnResize(col.key, e.clientX, colWidths[col.key] || col.width)}
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 품목 행들 */}
                      {data.items.map((item, itemIndex) => {
                        const renderCell = (col: TemplateColumn, isLast: boolean) => {
                          const cellClass = "border border-black p-0" + (isLast ? " relative" : "");
                          const alignClass = col.align === 'center' ? 'center' : col.align === 'right' ? 'right' : 'left';
                          
                          switch (col.key) {
                            case 'no':
                              return <td key={col.key} className="border border-black p-1 text-center bg-gray-50">{itemIndex + 1}</td>;
                            case 'name':
                              return <td key={col.key} className={cellClass}><EditableInput value={item.name} onChange={(v) => handleItemChange(item.id, 'name', v)} align={alignClass} multiline className="h-full px-2" /></td>;
                            case 'spec':
                              return <td key={col.key} className={cellClass}><EditableInput value={item.spec} onChange={(v) => handleItemChange(item.id, 'spec', v)} align={alignClass} multiline className="h-full px-1" /></td>;
                            case 'unit':
                              return <td key={col.key} className={cellClass}><EditableInput value={item.unit} onChange={(v) => handleItemChange(item.id, 'unit', v)} align="center" className="h-full px-1" /></td>;
                            case 'quantity':
                              return <td key={col.key} className={cellClass}><EditableInput value={formatNumber(item.quantity)} onChange={(v) => handleItemChange(item.id, 'quantity', parseNumber(v))} align="center" className="h-full px-2" /></td>;
                            case 'unitPrice':
                              return <td key={col.key} className={cellClass}><NumberInput value={item.unitPrice} onChange={(v) => handleItemChange(item.id, 'unitPrice', v)} decimalPlaces={calcSettings.priceDecimalPlaces} align="right" className="h-full px-2" /></td>;
                            case 'amount':
                              return (
                                <td key={col.key} className="border border-black p-1 text-right font-medium bg-gray-50/50 relative">
                                  {item.amount.toLocaleString()}
                                  {isLast && (
                                    <div className="absolute left-full top-0 bottom-0 flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" data-html2canvas-ignore>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => insertItemAfter(itemIndex)} title="아래에 항목 추가"><Plus className="w-3 h-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)} title="항목 삭제"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                  )}
                                </td>
                              );
                            case 'note':
                              return (
                                <td key={col.key} className={cellClass}>
                                  <EditableInput value={item.note} onChange={(v) => handleItemChange(item.id, 'note', v)} align="center" multiline className="h-full px-2" />
                                  {isLast && (
                                    <div className="absolute left-full top-0 bottom-0 flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" data-html2canvas-ignore>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => insertItemAfter(itemIndex)} title="아래에 항목 추가"><Plus className="w-3 h-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(item.id)} title="항목 삭제"><Trash2 className="w-3 h-3" /></Button>
                                    </div>
                                  )}
                                </td>
                              );
                            default:
                              return <td key={col.key} className={cellClass}><EditableInput value="" onChange={() => {}} align={alignClass} className="h-full px-2" /></td>;
                          }
                        };
                        
                        return (
                          <tr key={item.id} className="group hover:bg-blue-50/30 relative">
                            {selectedTemplate.columns.map((col, idx) => renderCell(col, idx === selectedTemplate.columns.length - 1))}
                          </tr>
                        );
                      })}
                      
                      {/* 소계/부가세/합계 */}
                      <tr className="bg-gray-50">
                        <td colSpan={selectedTemplate.columns.length - 2} className="border border-black p-2 text-center font-bold">소 계</td>
                        <td colSpan={2} className="border border-black p-2 text-right font-bold">{data.subtotal.toLocaleString()} {settings.currency}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={selectedTemplate.columns.length - 2} className="border border-black p-2 text-center font-bold">부 가 세</td>
                        <td colSpan={2} className="border border-black p-2 text-right font-bold">{data.vat.toLocaleString()} {settings.currency}</td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td colSpan={selectedTemplate.columns.length - 2} className="border border-black p-2 text-center font-bold text-lg">총 합 계</td>
                        <td colSpan={2} className="border border-black p-2 text-right font-bold text-lg text-blue-600">{data.total.toLocaleString()} {settings.currency}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                </div>

                {/* [Section] Remarks & Terms */}
                {settings.showSpecialTerms && (
                  <div className="text-sm space-y-4 pt-2 flex-shrink-0 mt-2">
                    <div className="flex gap-4 items-start pt-2">
                      <span className="font-bold w-20 text-gray-700 mt-1">특수조건</span>
                      <EditableTextarea 
                        value={data.remarks} 
                        onChange={(v) => setData({...data, remarks: v})}
                        rows={3}
                        placeholder="특수조건을 입력하세요"
                        className="flex-1 border border-gray-200 rounded p-2"
                      />
                    </div>
                  </div>
                )}
                
                {/* Footer */}
                <div className="text-center text-gray-400 text-xs flex-shrink-0 mt-auto pt-4">
                  Generated by BizOrder
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
