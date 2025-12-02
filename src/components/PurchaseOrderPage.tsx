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

interface PurchaseOrderData {
  orderNumber: string;
  date: string;
  deliveryDate: string;
  deliveryPlace: string;
  inspectionMethod: string;
  supplier: CompanyInfo;
  client: CompanyInfo;
  items: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  vatIncluded: boolean;
  remarks: string;
  paymentTerms: string;
}

type PaperSize = 'A4' | 'A3' | 'B5';
type Orientation = 'portrait' | 'landscape';
type Theme = 'classic' | 'modern' | 'minimal' | 'bold';

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

export function PurchaseOrderPage() {
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

  const [data, setData] = useState<PurchaseOrderData>({
    orderNumber: `PO-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryPlace: '본사 물류창고 입고',
    inspectionMethod: '현장 검수',
    supplier: {
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
    client: {
      name: '비즈오더 주식회사',
      registrationNumber: '123-45-67890',
      ownerName: '김대표',
      address: '서울시 강남구 테헤란로 123',
      businessType: '서비스',
      businessItem: '소프트웨어 개발',
      email: 'order@bizorder.kr',
      phone: '02-1234-5678',
      fax: '02-1234-5679',
    },
    items: [
      { ...INITIAL_ITEM, id: '1', name: '품목 1', quantity: 1, unitPrice: 10000, amount: 10000 },
    ],
    subtotal: 10000,
    vat: 1000,
    total: 11000,
    vatIncluded: false,
    remarks: '',
    paymentTerms: '세금계산서 발행 후 30일',
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
      pdf.save(`${data.orderNumber}_발주서.pdf`);
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
      ['발주서'],
      ['발주번호', data.orderNumber],
      ['발주일자', data.date],
      ['납기일자', data.deliveryDate],
      [''],
      ['수신(공급자)'],
      ['상호', data.supplier.name, '담당자', data.supplier.ownerName],
      ['연락처', data.supplier.phone, '이메일', data.supplier.email],
      [''],
      ['발주자'],
      ['상호', data.client.name, '담당자', data.client.ownerName],
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

    XLSX.utils.book_append_sheet(wb, ws, '발주서');
    XLSX.writeFile(wb, `${data.orderNumber}_발주서.xlsx`);
  };

  const renderThemeStyles = () => {
    switch (settings.theme) {
      case 'modern': return 'bg-white border-t-4 border-green-600';
      case 'minimal': return 'bg-white';
      case 'bold': return 'bg-slate-50 font-bold border-4 border-black';
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="border-b bg-white p-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={toggleSidebar} title={isSidebarOpen ? "사이드바 숨기기" : "사이드바 열기"}>
            <PanelLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">발주서 작성</h1>
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
                        <SelectItem value="modern">모던 (그린 포인트)</SelectItem>
                        <SelectItem value="minimal">미니멀</SelectItem>
                        <SelectItem value="bold">볼드</SelectItem>
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
                {/* [Section] Title Header */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold tracking-[1em] underline decoration-double underline-offset-8">발 주 서</h1>
                </div>

                {/* [Section] Document Info (Meta, Supplier, Client) */}
                <div className="flex justify-between mb-8 text-sm">
                  <div className="w-[45%]">
                    <table className="w-full border-collapse border border-black">
                      <tbody>
                        <tr>
                          <td className="border border-black bg-gray-100 p-2 text-center w-24 font-bold">발주번호</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              value={data.orderNumber} 
                              onChange={(v) => setData({...data, orderNumber: v})}
                              className="px-2"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black bg-gray-100 p-2 text-center font-bold">발주일자</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              type="date"
                              value={data.date} 
                              onChange={(v) => setData({...data, date: v})}
                              className="px-2"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black bg-gray-100 p-2 text-center font-bold">납기일자</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              type="date"
                              value={data.deliveryDate} 
                              onChange={(v) => setData({...data, deliveryDate: v})}
                              className="px-2"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="w-[45%]">
                    <table className="w-full border-collapse border border-black">
                      <tbody>
                        <tr>
                          <td rowSpan={4} className="border border-black bg-gray-100 p-2 text-center w-8 font-bold writing-mode-vertical">발주자</td>
                          <td className="border border-black p-1 text-center w-16 bg-gray-50">상호</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              value={data.client.name} 
                              onChange={(v) => setData({...data, client: {...data.client, name: v}})}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1 text-center bg-gray-50">등록번호</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              value={data.client.registrationNumber} 
                              onChange={(v) => setData({...data, client: {...data.client, registrationNumber: v}})}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1 text-center bg-gray-50">대표자</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              value={data.client.ownerName} 
                              onChange={(v) => setData({...data, client: {...data.client, ownerName: v}})}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1 text-center bg-gray-50">주소</td>
                          <td className="border border-black p-0">
                            <EditableInput 
                              value={data.client.address} 
                              onChange={(v) => setData({...data, client: {...data.client, address: v}})}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2 border-b-2 border-black pb-2 mb-2">
                    <EditableInput 
                      value={data.supplier.name} 
                      onChange={(v) => setData({...data, supplier: {...data.supplier, name: v}})}
                      placeholder="수신 (공급자 상호)"
                      className="text-xl font-bold w-64"
                    />
                    <span className="text-lg">귀하</span>
                  </div>
                  <div className="flex gap-4 text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span>담당자:</span>
                      <EditableInput 
                        value={data.supplier.ownerName} 
                        onChange={(v) => setData({...data, supplier: {...data.supplier, ownerName: v}})}
                        placeholder="담당자명"
                        className="w-32"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>연락처:</span>
                      <EditableInput 
                        value={data.supplier.phone} 
                        onChange={(v) => setData({...data, supplier: {...data.supplier, phone: v}})}
                        placeholder="연락처"
                        className="w-40"
                      />
                    </div>
                  </div>
                  <p className="text-sm">아래와 같이 발주하오니 기일 엄수하여 납품 바랍니다.</p>
                </div>

                {/* [Section] Line Items & Calculation */}
                <div className="relative">
                  <table className="w-full border-collapse border border-black mb-6 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2 w-12">No</th>
                        <th className="border border-black p-2">품명</th>
                        <th className="border border-black p-2 w-20">규격</th>
                        <th className="border border-black p-2 w-16">단위</th>
                        <th className="border border-black p-2 w-16">수량</th>
                        <th className="border border-black p-2 w-24">단가</th>
                        <th className="border border-black p-2 w-28">공급가액</th>
                        <th className="border border-black p-2 w-20">비고</th>
                        <th className="border border-black p-1 w-8 print:hidden bg-white border-l-0"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, index) => (
                        <tr key={item.id} className="group hover:bg-green-50/30">
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
                      <tr className="bg-gray-100">
                        <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">합 계 (VAT 포함)</td>
                        <td className="border border-black p-2 text-right font-bold text-lg">{data.total.toLocaleString()}</td>
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

                {/* [Section] Remarks & Terms */}
                <div className="border border-black p-4 text-sm space-y-2 mt-12">
                  <div className="flex gap-4 items-center">
                    <span className="font-bold w-24">납품 장소</span>
                    <EditableInput 
                      value={data.deliveryPlace} 
                      onChange={(v) => setData({...data, deliveryPlace: v})}
                    />
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="font-bold w-24">검수 방법</span>
                    <EditableInput 
                      value={data.inspectionMethod} 
                      onChange={(v) => setData({...data, inspectionMethod: v})}
                    />
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="font-bold w-24">결제 조건</span>
                    <EditableInput 
                      value={data.paymentTerms} 
                      onChange={(v) => setData({...data, paymentTerms: v})}
                    />
                  </div>
                  <div className="flex gap-4 items-start pt-2 border-t border-gray-200 mt-2">
                    <span className="font-bold w-24 mt-1">특이사항</span>
                    <EditableTextarea 
                      value={data.remarks} 
                      onChange={(v) => setData({...data, remarks: v})}
                      rows={3}
                      placeholder="특이사항 입력"
                    />
                  </div>
                </div>
                
                {/* [Section] Footer & Signature */}
                <div className="mt-12 flex justify-end">
                  <div className="text-center">
                    <p className="mb-4 text-sm">위와 같이 발주합니다.</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold">발주 담당자 : </span>
                      <span className="text-lg border-b border-black px-8 pb-1 w-40 inline-block"></span>
                      <span className="text-sm">(인)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
