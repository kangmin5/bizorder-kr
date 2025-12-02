import { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  FileSpreadsheet,
  Download,
  Settings2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
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
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className={cn(
      "bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-full resize-none transition-colors",
      className
    )}
  />
);

export function TransactionStatementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
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
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.paperSize.toLowerCase(),
      });

      const { width, height } = getPaperDimensions();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
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
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-gray-50 border-r">
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
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="B5">B5</SelectItem>
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
                        <SelectItem value="portrait">세로</SelectItem>
                        <SelectItem value="landscape">가로</SelectItem>
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
                        <SelectItem value="minimal">미니멀</SelectItem>
                        <SelectItem value="bold">볼드</SelectItem>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} className="bg-slate-100">
          <div className="h-full overflow-auto">
            <div className="flex justify-center p-8 min-w-[800px]">
              <div 
                ref={printRef}
                className={cn(
                  "shadow-lg transition-all duration-300 p-[10mm] box-border relative bg-white",
                  renderThemeStyles()
                )}
                style={{
                  width: `${getPaperDimensions().width}mm`,
                  minHeight: `${getPaperDimensions().height}mm`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* Header */}
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

                {/* Client Info */}
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

                {/* Items Table */}
                <div className="relative">
                  <table className="w-full border-collapse border border-black mb-8 text-sm">
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
                        <th className="border border-black p-1 w-8 print:hidden bg-white border-l-0"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-blue-50/30">
                          <td className="border border-black p-1 text-center bg-gray-50">{index + 1}</td>
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
                          <td className="border-0 p-0 text-center print:hidden align-middle">
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
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="border border-black p-2 text-center font-bold">소 계</td>
                        <td className="border border-black p-2 text-right font-bold">{data.subtotal.toLocaleString()}</td>
                        <td className="border border-black p-2"></td>
                        <td className="border-0 print:hidden"></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="border border-black p-2 text-center font-bold">부 가 세</td>
                        <td className="border border-black p-2 text-right font-bold">{data.vat.toLocaleString()}</td>
                        <td className="border border-black p-2"></td>
                        <td className="border-0 print:hidden"></td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">총 합 계</td>
                        <td className="border border-black p-2 text-right font-bold text-lg text-blue-600">{data.total.toLocaleString()}</td>
                        <td className="border border-black p-2"></td>
                        <td className="border-0 print:hidden"></td>
                      </tr>
                    </tfoot>
                  </table>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addItem}
                    className="absolute -bottom-10 left-0 print:hidden"
                  >
                    <Plus className="w-4 h-4 mr-2" /> 품목 추가
                  </Button>
                </div>

                {/* Footer Conditions */}
                <div className="text-sm space-y-4 mt-auto pt-8">
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

                <div className="mt-12 text-center text-gray-400 text-xs">
                  Generatred by BizOrder
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
