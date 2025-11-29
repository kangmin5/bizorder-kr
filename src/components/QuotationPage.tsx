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

interface PageSettings {
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

// --- Component ---

export function QuotationPage() {
  // State
  const [activeTab, setActiveTab] = useState('edit');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<PageSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    theme: 'classic',
    showPageNumbers: true,
    margins: 10,
  });

  const [data, setData] = useState<QuotationData>({
    quotationNumber: `QT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    paymentTerms: '계약일로부터 7일 이내',
    deliveryTerms: '발주 후 2주 이내',
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    calculateTotals();
  }, [data.items, data.vatIncluded]);

  // Handlers
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

  // Export Functions
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
    
    // 셀 너비 조정
    ws['!cols'] = [
      { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '견적서');
    XLSX.writeFile(wb, `${data.quotationNumber}_견적서.xlsx`);
  };

  // Render Helpers
  const renderThemeStyles = () => {
    switch (settings.theme) {
      case 'modern':
        return 'bg-white border-l-4 border-blue-500';
      case 'minimal':
        return 'bg-white grayscale';
      case 'bold':
        return 'bg-slate-50 font-bold border-4 border-black';
      case 'blue':
        return 'bg-blue-50 text-blue-900';
      case 'dark':
        return 'bg-slate-800 text-white';
      default: // classic
        return 'bg-white border border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-[1600px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">견적서 작성</h1>
          <p className="text-muted-foreground">전문적인 견적서를 쉽고 빠르게 작성하세요.</p>
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
                <DialogTitle>견적서 공유</DialogTitle>
                <DialogDescription>이메일이나 메신저로 견적서를 전송합니다.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => alert('이메일 발송 준비 중')}>
                    <Mail className="w-6 h-6" />
                    이메일 발송
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => alert('카카오톡 공유 준비 중')}>
                    <MessageCircle className="w-6 h-6" />
                    카카오톡 공유
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> 엑셀 저장
          </Button>
          <Button onClick={handleExportPDF} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" /> 
            {isLoading ? '생성 중...' : 'PDF 다운로드'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">작성 및 수정</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>

        {/* --- Edit Tab --- */}
        <TabsContent value="edit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>견적번호</Label>
                      <Input 
                        value={data.quotationNumber} 
                        onChange={(e) => setData({...data, quotationNumber: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>견적일자</Label>
                      <Input 
                        type="date" 
                        value={data.date} 
                        onChange={(e) => setData({...data, date: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>유효기간</Label>
                      <Input 
                        type="date" 
                        value={data.validUntil} 
                        onChange={(e) => setData({...data, validUntil: e.target.value})} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>공급받는자 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>상호명 (법인명)</Label>
                    <Input 
                      value={data.client.name} 
                      onChange={(e) => setData({...data, client: {...data.client, name: e.target.value}})}
                      placeholder="(주)고객사"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>대표자 성명</Label>
                      <Input 
                        value={data.client.ownerName} 
                        onChange={(e) => setData({...data, client: {...data.client, ownerName: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>담당자 연락처</Label>
                      <Input 
                        value={data.client.phone} 
                        onChange={(e) => setData({...data, client: {...data.client, phone: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input 
                      value={data.client.email} 
                      onChange={(e) => setData({...data, client: {...data.client, email: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>주소</Label>
                    <Input 
                      value={data.client.address} 
                      onChange={(e) => setData({...data, client: {...data.client, address: e.target.value}})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Settings & Supplier */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>문서 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="vat" 
                      checked={data.vatIncluded}
                      onCheckedChange={(c) => setData({...data, vatIncluded: !!c})}
                    />
                    <Label htmlFor="vat">부가세 포함 단가 적용</Label>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>공급자 정보 (내 정보)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>상호</Label>
                      <Input 
                        value={data.supplier.name} 
                        onChange={(e) => setData({...data, supplier: {...data.supplier, name: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>등록번호</Label>
                      <Input 
                        value={data.supplier.registrationNumber} 
                        onChange={(e) => setData({...data, supplier: {...data.supplier, registrationNumber: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>직인 이미지 업로드</Label>
                    <div className="flex gap-2">
                      <Input type="file" accept="image/*" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>품목 내역</CardTitle>
              <Button onClick={addItem} size="sm">
                <Plus className="w-4 h-4 mr-2" /> 품목 추가
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>품명</TableHead>
                    <TableHead className="w-[100px]">규격</TableHead>
                    <TableHead className="w-[80px]">단위</TableHead>
                    <TableHead className="w-[80px]">수량</TableHead>
                    <TableHead className="w-[120px]">단가</TableHead>
                    <TableHead className="w-[120px]">공급가액</TableHead>
                    <TableHead className="w-[150px]">비고</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>
                        <Input 
                          value={item.name} 
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.spec} 
                          onChange={(e) => handleItemChange(item.id, 'spec', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.unit} 
                          onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                          className="h-8 text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.note} 
                          onChange={(e) => handleItemChange(item.id, 'note', e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-6 space-y-2">
                <div className="w-[300px] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>공급가액 합계</span>
                    <span>{data.subtotal.toLocaleString()} 원</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>세액 (VAT)</span>
                    <span>{data.vat.toLocaleString()} 원</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>총 합계</span>
                    <span className="text-blue-600">{data.total.toLocaleString()} 원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>기타 조건</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>결제조건</Label>
                  <Input 
                    value={data.paymentTerms} 
                    onChange={(e) => setData({...data, paymentTerms: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>납기조건</Label>
                  <Input 
                    value={data.deliveryTerms} 
                    onChange={(e) => setData({...data, deliveryTerms: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>특이사항 / 비고</Label>
                <Textarea 
                  value={data.remarks} 
                  onChange={(e) => setData({...data, remarks: e.target.value})}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Preview Tab --- */}
        <TabsContent value="preview" className="flex justify-center bg-slate-100 p-8 rounded-lg overflow-auto">
          <div 
            ref={printRef}
            className={cn(
              "shadow-lg transition-all duration-300 p-[10mm] box-border relative",
              renderThemeStyles()
            )}
            style={{
              width: `${getPaperDimensions().width}mm`,
              minHeight: `${getPaperDimensions().height}mm`,
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold tracking-widest mb-2">견 적 서</h1>
                <div className="text-sm space-y-1">
                  <p>견적번호 : {data.quotationNumber}</p>
                  <p>견적일자 : {data.date}</p>
                  <p>유효기간 : {data.validUntil}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600 mb-2">
                  {data.total.toLocaleString()} 원
                  <span className="text-sm text-black font-normal ml-2">(VAT 포함)</span>
                </p>
                <div className="border border-gray-300 p-4 rounded text-left text-sm w-[300px]">
                  <p className="font-bold mb-2">공급자</p>
                  <div className="grid grid-cols-[60px_1fr] gap-1">
                    <span className="text-gray-500">상호</span>
                    <span>{data.supplier.name}</span>
                    <span className="text-gray-500">등록번호</span>
                    <span>{data.supplier.registrationNumber}</span>
                    <span className="text-gray-500">대표자</span>
                    <span>{data.supplier.ownerName}</span>
                    <span className="text-gray-500">주소</span>
                    <span>{data.supplier.address}</span>
                    <span className="text-gray-500">연락처</span>
                    <span>{data.supplier.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2 border-b border-black pb-2 mb-4">
                <span className="text-xl font-bold">{data.client.name}</span>
                <span className="text-lg">귀하</span>
              </div>
              <p className="mb-4">아래와 같이 견적합니다.</p>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-black mb-8 text-sm">
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
                {/* 빈 행 채우기 (옵션) */}
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
                <tr className="bg-gray-50">
                  <td colSpan={6} className="border border-black p-2 text-center font-bold">소 계</td>
                  <td className="border border-black p-2 text-right font-bold">{data.subtotal.toLocaleString()}</td>
                  <td className="border border-black p-2"></td>
                </tr>
                <tr className="bg-gray-50">
                  <td colSpan={6} className="border border-black p-2 text-center font-bold">부 가 세</td>
                  <td className="border border-black p-2 text-right font-bold">{data.vat.toLocaleString()}</td>
                  <td className="border border-black p-2"></td>
                </tr>
                <tr className="bg-gray-100">
                  <td colSpan={6} className="border border-black p-2 text-center font-bold text-lg">총 합 계</td>
                  <td className="border border-black p-2 text-right font-bold text-lg">{data.total.toLocaleString()}</td>
                  <td className="border border-black p-2"></td>
                </tr>
              </tfoot>
            </table>

            {/* Footer Conditions */}
            <div className="text-sm space-y-2 mt-auto">
              <div className="flex gap-4">
                <span className="font-bold w-20">결제조건</span>
                <span>{data.paymentTerms}</span>
              </div>
              <div className="flex gap-4">
                <span className="font-bold w-20">납기조건</span>
                <span>{data.deliveryTerms}</span>
              </div>
              {data.remarks && (
                <div className="flex gap-4 mt-4">
                  <span className="font-bold w-20">비고</span>
                  <span className="whitespace-pre-wrap">{data.remarks}</span>
                </div>
              )}
            </div>

            <div className="mt-12 text-center text-gray-500 text-xs">
              Generatred by BizOrder
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
