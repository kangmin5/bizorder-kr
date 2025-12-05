import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// 한글 폰트 등록 (Google Fonts CDN)
Font.register({
  family: 'NanumGothic',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

// 스타일 정의
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'NanumGothic',
    fontSize: 9,
  },
  banner: {
    width: '100%',
    marginBottom: 10,
    marginTop: -30,
    marginLeft: -30,
    marginRight: -30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1e40af',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoBox: {
    width: '48%',
    border: '1px solid #000',
  },
  infoHeader: {
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    borderBottom: '1px solid #000',
  },
  infoContent: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    width: 60,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginTop: 15,
    border: '1px solid #000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderBottom: '1px solid #000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    padding: 5,
    borderRight: '1px solid #e5e7eb',
  },
  tableCellLast: {
    padding: 5,
  },
  colNo: { width: '5%', textAlign: 'center' },
  colName: { width: '30%' },
  colSpec: { width: '15%' },
  colUnit: { width: '8%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'right' },
  colPrice: { width: '12%', textAlign: 'right' },
  colAmount: { width: '12%', textAlign: 'right' },
  colNote: { width: '10%' },
  summaryRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000',
  },
  summaryLabel: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    borderRight: '1px solid #000',
  },
  summaryValue: {
    width: '24%',
    padding: 5,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  totalLabel: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 11,
    borderRight: '1px solid #000',
  },
  totalValue: {
    width: '24%',
    padding: 8,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#1e40af',
  },
  remarksSection: {
    marginTop: 20,
    border: '1px solid #000',
  },
  remarksHeader: {
    backgroundColor: '#f3f4f6',
    padding: 5,
    fontWeight: 'bold',
    borderBottom: '1px solid #000',
  },
  remarksContent: {
    padding: 10,
    minHeight: 60,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
  stampContainer: {
    position: 'absolute',
    right: 80,
    top: 180,
    width: 60,
    height: 60,
  },
  stamp: {
    width: 60,
    height: 60,
  },
});

// 타입 정의
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
  representative: string;
  businessNumber: string;
  address: string;
  phone: string;
  email: string;
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

interface QuotationPDFProps {
  data: QuotationData;
  currency?: string;
  bannerImage?: string;
  stampImage?: string;
  showRemarks?: boolean;
}

export function QuotationPDF({
  data,
  currency = '원',
  bannerImage,
  stampImage,
  showRemarks = true,
}: QuotationPDFProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 상단 배너 */}
        {bannerImage && (
          <Image src={bannerImage} style={styles.banner} />
        )}

        {/* 제목 */}
        <Text style={styles.title}>견 적 서</Text>

        {/* 견적 정보 */}
        <View style={styles.headerRow}>
          {/* 공급자 정보 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoHeader}>공급자</Text>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>상호명</Text>
                <Text style={styles.infoValue}>{data.supplier.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>대표자</Text>
                <Text style={styles.infoValue}>{data.supplier.representative}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>사업자번호</Text>
                <Text style={styles.infoValue}>{data.supplier.businessNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoValue}>{data.supplier.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>연락처</Text>
                <Text style={styles.infoValue}>{data.supplier.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이메일</Text>
                <Text style={styles.infoValue}>{data.supplier.email}</Text>
              </View>
            </View>
          </View>

          {/* 수신자 정보 */}
          <View style={styles.infoBox}>
            <Text style={styles.infoHeader}>수신자</Text>
            <View style={styles.infoContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>상호명</Text>
                <Text style={styles.infoValue}>{data.client.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>대표자</Text>
                <Text style={styles.infoValue}>{data.client.representative}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>사업자번호</Text>
                <Text style={styles.infoValue}>{data.client.businessNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoValue}>{data.client.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>연락처</Text>
                <Text style={styles.infoValue}>{data.client.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>이메일</Text>
                <Text style={styles.infoValue}>{data.client.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 견적 번호 및 날짜 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text>견적번호: {data.quotationNumber}</Text>
          <Text>견적일자: {data.date}</Text>
          <Text>유효기간: {data.validUntil}</Text>
        </View>

        {/* 품목 테이블 */}
        <View style={styles.table}>
          {/* 테이블 헤더 */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colNo]}>No</Text>
            <Text style={[styles.tableCell, styles.colName]}>품명</Text>
            <Text style={[styles.tableCell, styles.colSpec]}>규격</Text>
            <Text style={[styles.tableCell, styles.colUnit]}>단위</Text>
            <Text style={[styles.tableCell, styles.colQty]}>수량</Text>
            <Text style={[styles.tableCell, styles.colPrice]}>단가</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>금액</Text>
            <Text style={[styles.tableCellLast, styles.colNote]}>비고</Text>
          </View>

          {/* 테이블 본문 */}
          {data.items.map((item, index) => (
            <View 
              key={item.id} 
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
              <Text style={[styles.tableCell, styles.colName]}>{item.name}</Text>
              <Text style={[styles.tableCell, styles.colSpec]}>{item.spec}</Text>
              <Text style={[styles.tableCell, styles.colUnit]}>{item.unit}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{formatNumber(item.quantity)}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatNumber(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, styles.colAmount]}>{formatNumber(item.amount)}</Text>
              <Text style={[styles.tableCellLast, styles.colNote]}>{item.note}</Text>
            </View>
          ))}

          {/* 합계 */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>공급가액</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.subtotal)} {currency}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>부가세</Text>
            <Text style={styles.summaryValue}>{formatNumber(data.vat)} {currency}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>총 합 계</Text>
            <Text style={styles.totalValue}>{formatNumber(data.total)} {currency}</Text>
          </View>
        </View>

        {/* 비고/특이사항 */}
        {showRemarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksHeader}>비고 및 특이사항</Text>
            <View style={styles.remarksContent}>
              <Text>{data.remarks || ''}</Text>
              {data.paymentTerms && <Text>• 결제조건: {data.paymentTerms}</Text>}
              {data.deliveryTerms && <Text>• 납품조건: {data.deliveryTerms}</Text>}
            </View>
          </View>
        )}

        {/* 직인 */}
        {stampImage && (
          <View style={styles.stampContainer}>
            <Image src={stampImage} style={styles.stamp} />
          </View>
        )}

        {/* 푸터 */}
        <Text style={styles.footer}>
          Generated by BizOrder.kr
        </Text>
      </Page>
    </Document>
  );
}

export default QuotationPDF;
