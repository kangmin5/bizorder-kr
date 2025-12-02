import  { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  Share2, 
  Plus, 
  Trash2, 
  Mail,
  MessageCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
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
  deliveryPlace: string; // 납품 장소
  inspectionMethod: string; // 검수 방법
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

// --- Component ---

export function PurchaseOrderPage() {
  const [activeTab, setActiveTab] = useState('edit');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="container mx-auto py-6 max-w-[1600px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">발주서 작성</h1>
          <p className="text-muted-foreground">협력업체에 발주서를 전송하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> 인쇄
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> 공유
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>발주서 공유</DialogTitle>
                <DialogDescription>발주서를 협력사에 전송합니다.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Mail className="w-6 h-6" /> 이메일 발송
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageCircle className="w-6 h-6" /> 카카오톡 공유
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> 엑셀 저장
          </Button>
          <Button onClick={handleExportPDF} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" /> {isLoading ? '생성 중...' : 'PDF 다운로드'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">작성 및 수정</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>발주 정보</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>발주번호</Label>
                      <Input value={data.orderNumber} onChange={(e) => setData({...data, orderNumber: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>발주일자</Label>
                      <Input type="date" value={data.date} onChange={(e) => setData({...data, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>납기일자</Label>
                      <Input type="date" value={data.deliveryDate} onChange={(e) => setData({...data, deliveryDate: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>납품 장소</Label>
                    <Input value={data.deliveryPlace} onChange={(e) => setData({...data, deliveryPlace: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>검수 방법</Label>
                    <Input value={data.inspectionMethod} onChange={(e) => setData({...data, inspectionMethod: e.target.value})} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>공급자 정보 (수신)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>상호명</Label>
                    <Input value={data.supplier.name} onChange={(e) => setData({...data, supplier: {...data.supplier, name: e.target.value}})} placeholder="거래처 상호" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>담당자</Label>
                      <Input value={data.supplier.ownerName} onChange={(e) => setData({...data, supplier: {...data.supplier, ownerName: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <Label>연락처</Label>
                      <Input value={data.supplier.phone} onChange={(e) => setData({...data, supplier: {...data.supplier, phone: e.target.value}})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input value={data.supplier.email} onChange={(e) => setData({...data, supplier: {...data.supplier, email: e.target.value}})} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings & Client */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>문서 설정</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>용지 크기</Label>
                      <Select value={settings.paperSize} onValueChange={(v: PaperSize) => setSettings({...settings, paperSize: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                          <SelectItem value="B5">B5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>방향</Label>
                      <Select value={settings.orientation} onValueChange={(v: Orientation) => setSettings({...settings, orientation: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">세로</SelectItem>
                          <SelectItem value="landscape">가로</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="vat" checked={data.vatIncluded} onCheckedChange={(c) => setData({...data, vatIncluded: !!c})} />
                    <Label htmlFor="vat">부가세 포함</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>발주 품목</CardTitle>
              <Button onClick={addItem} size="sm"><Plus className="w-4 h-4 mr-2" /> 추가</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>품명</TableHead>
                    <TableHead>규격</TableHead>
                    <TableHead>단위</TableHead>
                    <TableHead>수량</TableHead>
                    <TableHead>단가</TableHead>
                    <TableHead>공급가액</TableHead>
                    <TableHead>비고</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell><Input value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} /></TableCell>
                      <TableCell><Input value={item.spec} onChange={(e) => handleItemChange(item.id, 'spec', e.target.value)} /></TableCell>
                      <TableCell><Input value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="text-right" /></TableCell>
                      <TableCell><Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} className="text-right" /></TableCell>
                      <TableCell className="text-right">{item.amount.toLocaleString()}</TableCell>
                      <TableCell><Input value={item.note} onChange={(e) => handleItemChange(item.id, 'note', e.target.value)} /></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-end mt-4">
                <div className="w-[300px] space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>합계</span>
                    <span className="text-blue-600">{data.total.toLocaleString()} 원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>특이사항 및 비고</Label>
                <Textarea value={data.remarks} onChange={(e) => setData({...data, remarks: e.target.value})} rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="flex justify-center bg-slate-100 p-8 rounded-lg overflow-auto">
          <div 
            ref={printRef}
            className={cn(
              "shadow-lg p-[10mm] box-border relative",
              renderThemeStyles()
            )}
            style={{
              width: `${getPaperDimensions().width}mm`,
              minHeight: `${getPaperDimensions().height}mm`,
            }}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-[1em] underline decoration-double underline-offset-8">발 주 서</h1>
            </div>

            <div className="flex justify-between mb-8 text-sm">
              <div className="w-[45%]">
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="border border-black bg-gray-100 p-2 text-center w-24 font-bold">발주번호</td>
                      <td className="border border-black p-2">{data.orderNumber}</td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-gray-100 p-2 text-center font-bold">발주일자</td>
                      <td className="border border-black p-2">{data.date}</td>
                    </tr>
                    <tr>
                      <td className="border border-black bg-gray-100 p-2 text-center font-bold">납기일자</td>
                      <td className="border border-black p-2">{data.deliveryDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="w-[45%]">
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td rowSpan={4} className="border border-black bg-gray-100 p-2 text-center w-8 font-bold writing-mode-vertical">발주자</td>
                      <td className="border border-black p-1 text-center w-16">상호</td>
                      <td className="border border-black p-1">{data.client.name}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 text-center">등록번호</td>
                      <td className="border border-black p-1">{data.client.registrationNumber}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 text-center">대표자</td>
                      <td className="border border-black p-1">{data.client.ownerName}</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1 text-center">주소</td>
                      <td className="border border-black p-1">{data.client.address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-2 border-b-2 border-black pb-2 mb-2">
                <span className="text-xl font-bold">{data.supplier.name}</span>
                <span className="text-lg">귀하</span>
              </div>
              <p>아래와 같이 발주하오니 기일 엄수하여 납품 바랍니다.</p>
            </div>

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
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-black p-2 text-center">{index + 1}</td>
                    <td className="border border-black p-2">{item.name}</td>
                    <td className="border border-black p-2 text-center">{item.spec}</td>
                    <td className="border border-black p-2 text-center">{item.unit}</td>
                    <td className="border border-black p-2 text-right">{item.quantity.toLocaleString()}</td>
                    <td className="border border-black p-2 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="border border-black p-2 text-right">{item.amount.toLocaleString()}</td>
                    <td className="border border-black p-2">{item.note}</td>
                  </tr>
                ))}
                 {Array.from({ length: Math.max(0, 10 - data.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black p-2 text-center">&nbsp;</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2"></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">합 계 (VAT 포함)</td>
                  <td colSpan={2} className="border border-black p-2 text-right font-bold text-lg">{data.total.toLocaleString()} 원</td>
                </tr>
              </tfoot>
            </table>

            <div className="border border-black p-4 text-sm space-y-2">
              <div className="flex gap-4">
                <span className="font-bold w-24">납품 장소</span>
                <span>{data.deliveryPlace}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold w-24">검수 방법</span>
                <span>{data.inspectionMethod}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold w-24">결제 조건</span>
                <span>{data.paymentTerms}</span>
              </div>
              {data.remarks && (
                <div className="flex gap-4 mt-2 pt-2 border-t border-gray-300">
                  <span className="font-bold w-24">특이사항</span>
                  <span className="whitespace-pre-wrap">{data.remarks}</span>
                </div>
              )}
            </div>
            
            <div className="mt-12 flex justify-end">
              <div className="text-center">
                <p className="mb-4 text-sm">위와 같이 발주합니다.</p>
                <div className="flex items-end gap-2">
                  <span className="text-lg font-bold">발주 담당자 : </span>
                  <span className="text-lg border-b border-black px-8 pb-1"></span>
                  <span className="text-sm">(인)</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
