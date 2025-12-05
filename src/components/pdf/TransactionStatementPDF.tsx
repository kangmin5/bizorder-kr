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

// 스타일 정의 - 화면 레이아웃과 동일하게
const styles = StyleSheet.create({
  page: {
    padding: 25,
    fontFamily: 'NanumGothic',
    fontSize: 9,
  },
  banner: {
    width: '110%',
    marginBottom: 10,
    marginTop: -25,
    marginLeft: -25,
  },
  // 제목 라인 (중앙 정렬)
  titleRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
    color: '#16a34a',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  vatText: {
    fontSize: 9,
    color: '#000',
    fontWeight: 'normal',
  },
  // 메인 컨텐츠 영역 (좌우 분할)
  mainContent: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  // 좌측 영역
  leftSection: {
    flex: 1,
  },
  // 메타데이터 그리드
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    width: 55,
    color: '#6b7280',
    fontSize: 8,
  },
  metaValue: {
    flex: 1,
    fontSize: 9,
  },
  // 수신처 섹션
  clientSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientLabel: {
    color: '#6b7280',
    width: 55,
    fontSize: 9,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  honorific: {
    fontSize: 11,
  },
  clientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 3,
  },
  // 우측 영역 (공급자)
  rightSection: {
    width: 160,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    padding: 8,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
    marginBottom: 6,
  },
  supplierTitle: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  stamp: {
    width: 35,
    height: 35,
  },
  supplierGrid: {
    marginBottom: 0,
  },
  supplierItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  supplierLabel: {
    width: 45,
    color: '#9ca3af',
    fontSize: 8,
  },
  supplierValue: {
    flex: 1,
    fontSize: 8,
  },
  // 담당자 정보
  managerSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 6,
    paddingTop: 6,
  },
  managerItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  managerLabel: {
    width: 40,
    color: '#9ca3af',
    fontSize: 7,
  },
  managerValue: {
    flex: 1,
    fontSize: 7,
    color: '#4b5563',
  },
  // 테이블
  descText: {
    fontSize: 9,
    color: '#4b5563',
    marginBottom: 6,
  },
  currencyUnit: {
    textAlign: 'right',
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dcfce7',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tableCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    fontSize: 8,
  },
  tableCellLast: {
    padding: 4,
    fontSize: 8,
  },
  // 컬럼 너비
  colNo: { width: '5%', textAlign: 'center' },
  colName: { width: '30%' },
  colSpec: { width: '12%' },
  colUnit: { width: '8%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'right' },
  colPrice: { width: '12%', textAlign: 'right' },
  colAmount: { width: '15%', textAlign: 'right' },
  colNote: { width: '10%' },
  // 합계
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  summaryLabel: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 9,
  },
  summaryValue: {
    width: '25%',
    padding: 5,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
  },
  totalLabel: {
    flex: 1,
    padding: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 11,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  totalValue: {
    width: '25%',
    padding: 6,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 11,
    color: '#16a34a',
  },
  // 비고
  remarksSection: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  remarksHeader: {
    backgroundColor: '#f0fdf4',
    padding: 5,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    fontSize: 9,
  },
  remarksContent: {
    padding: 8,
    minHeight: 40,
    fontSize: 8,
  },
  footer: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 7,
    color: '#9ca3af',
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

interface UserInfo {
  name?: string;
  position?: string;
  mobile?: string;
  email?: string;
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
  userInfo?: UserInfo;
}

export function TransactionStatementPDF({
  data,
  currency = '원',
  bannerImage,
  stampImage,
  showRemarks = true,
  userInfo,
}: TransactionStatementPDFProps) {
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

        {/* 제목 (중앙) + 총금액 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>거 래 명 세 서</Text>
          <View style={styles.totalAmountRow}>
            <Text style={styles.totalAmount}>
              {formatNumber(data.total)} {currency}{' '}
              <Text style={styles.vatText}>(VAT 포함)</Text>
            </Text>
          </View>
        </View>

        {/* 메인 컨텐츠 (좌우 분할) */}
        <View style={styles.mainContent}>
          {/* 좌측: 메타데이터 + 수신처 */}
          <View style={styles.leftSection}>
            {/* 메타데이터 */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>명세서번호</Text>
                <Text style={styles.metaValue}>{data.statementNumber}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>거래일자</Text>
                <Text style={styles.metaValue}>{data.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>결제조건</Text>
                <Text style={styles.metaValue}>{data.paymentTerms}</Text>
              </View>
            </View>

            {/* 수신처 */}
            <View style={styles.clientSection}>
              <View style={styles.clientHeader}>
                <Text style={styles.clientLabel}>공급받는자</Text>
                <Text style={styles.clientName}>{data.client.name}</Text>
                <Text style={styles.honorific}> 귀하</Text>
              </View>
              <View style={styles.clientGrid}>
                <View style={styles.clientItem}>
                  <Text style={styles.metaLabel}>담당자</Text>
                  <Text style={styles.metaValue}>{data.client.representative}</Text>
                </View>
                <View style={styles.clientItem}>
                  <Text style={styles.metaLabel}>연락처</Text>
                  <Text style={styles.metaValue}>{data.client.phone}</Text>
                </View>
                <View style={styles.clientItem}>
                  <Text style={styles.metaLabel}>이메일</Text>
                  <Text style={styles.metaValue}>{data.client.email}</Text>
                </View>
                <View style={styles.clientItem}>
                  <Text style={styles.metaLabel}>사업자번호</Text>
                  <Text style={styles.metaValue}>{data.client.businessNumber}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 우측: 공급자 + 담당자 */}
          <View style={styles.rightSection}>
            <View style={styles.supplierHeader}>
              <Text style={styles.supplierTitle}>공급자</Text>
              {stampImage && (
                <Image src={stampImage} style={styles.stamp} />
              )}
            </View>
            <View style={styles.supplierGrid}>
              <View style={styles.supplierItem}>
                <Text style={styles.supplierLabel}>상호</Text>
                <Text style={styles.supplierValue}>{data.supplier.name}</Text>
              </View>
              <View style={styles.supplierItem}>
                <Text style={styles.supplierLabel}>사업자번호</Text>
                <Text style={styles.supplierValue}>{data.supplier.businessNumber}</Text>
              </View>
              <View style={styles.supplierItem}>
                <Text style={styles.supplierLabel}>대표자</Text>
                <Text style={styles.supplierValue}>{data.supplier.representative}</Text>
              </View>
              <View style={styles.supplierItem}>
                <Text style={styles.supplierLabel}>연락처</Text>
                <Text style={styles.supplierValue}>{data.supplier.phone}</Text>
              </View>
            </View>
            
            {/* 담당자 정보 */}
            {userInfo && (userInfo.name || userInfo.mobile || userInfo.email) && (
              <View style={styles.managerSection}>
                <View style={styles.managerItem}>
                  <Text style={styles.managerLabel}>담당</Text>
                  <Text style={styles.managerValue}>
                    {userInfo.name}{userInfo.position && ` (${userInfo.position})`}
                  </Text>
                </View>
                {userInfo.mobile && (
                  <View style={styles.managerItem}>
                    <Text style={styles.managerLabel}>연락처</Text>
                    <Text style={styles.managerValue}>{userInfo.mobile}</Text>
                  </View>
                )}
                {userInfo.email && (
                  <View style={styles.managerItem}>
                    <Text style={styles.managerLabel}>이메일</Text>
                    <Text style={styles.managerValue}>{userInfo.email}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* 설명 텍스트 */}
        <Text style={styles.descText}>아래와 같이 거래내역을 명세합니다.</Text>

        {/* 단위 표시 */}
        <Text style={styles.currencyUnit}>(단위: {currency})</Text>

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
            <Text style={[styles.tableCell, styles.colAmount]}>공급가액</Text>
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
            </View>
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

export default TransactionStatementPDF;
