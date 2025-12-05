import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// 한글 폰트 등록
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
    color: '#16a34a',
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
    backgroundColor: '#f0fdf4',
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
    backgroundColor: '#dcfce7',
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
    backgroundColor: '#f0fdf4',
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
    color: '#16a34a',
  },
  remarksSection: {
    marginTop: 20,
    border: '1px solid #000',
  },
  remarksHeader: {
    backgroundColor: '#f0fdf4',
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
  paymentTerms: string;
}

interface TransactionStatementPDFProps {
  data: TransactionStatementData;
  currency?: string;
  bannerImage?: string;
  stampImage?: string;
  showRemarks?: boolean;
}

export function TransactionStatementPDF({
  data,
  currency = '원',
  bannerImage,
  stampImage,
  showRemarks = true,
}: TransactionStatementPDFProps) {
  const formatNumber = (num: number) => {
    return num.toLocaleString('ko-KR');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {bannerImage && (
          <Image src={bannerImage} style={styles.banner} />
        )}

        <Text style={styles.title}>거 래 명 세 서</Text>

        <View style={styles.headerRow}>
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
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoHeader}>공급받는자</Text>
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
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text>명세서번호: {data.statementNumber}</Text>
          <Text>거래일자: {data.date}</Text>
        </View>

        <View style={styles.table}>
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

        {showRemarks && (
          <View style={styles.remarksSection}>
            <Text style={styles.remarksHeader}>비고 및 특이사항</Text>
            <View style={styles.remarksContent}>
              <Text>{data.remarks || ''}</Text>
              {data.paymentTerms && <Text>• 결제조건: {data.paymentTerms}</Text>}
            </View>
          </View>
        )}

        {stampImage && (
          <View style={styles.stampContainer}>
            <Image src={stampImage} style={styles.stamp} />
          </View>
        )}

        <Text style={styles.footer}>
          Generated by BizOrder.kr
        </Text>
      </Page>
    </Document>
  );
}

export default TransactionStatementPDF;
