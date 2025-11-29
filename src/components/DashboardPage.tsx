import { 
  FileText, 
  FileCheck, 
  Receipt, 
  TrendingUp, 
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from './ui/badge';

type Page = 'home' | 'quotation' | 'purchase-order' | 'transaction-statement' | 'subscription' | 'dashboard' | 'settings';

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  // Sample data
  const stats = [
    {
      title: '총 문서 수',
      value: '147',
      change: '+12.5%',
      trend: 'up' as const,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '이번 달 작성',
      value: '28',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '총 거래액',
      value: '₩45.2M',
      change: '+23.1%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '평균 문서 금액',
      value: '₩1.8M',
      change: '-2.4%',
      trend: 'down' as const,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const documentTypeData = [
    { name: '견적서', count: 68, color: '#3b82f6' },
    { name: '발주서', count: 45, color: '#10b981' },
    { name: '거래명세서', count: 34, color: '#8b5cf6' },
  ];

  const monthlyData = [
    { month: '5월', 견적서: 12, 발주서: 8, 거래명세서: 6 },
    { month: '6월', 견적서: 15, 발주서: 11, 거래명세서: 8 },
    { month: '7월', 견적서: 18, 발주서: 13, 거래명세서: 10 },
    { month: '8월', 견적서: 14, 발주서: 9, 거래명세서: 7 },
    { month: '9월', 견적서: 20, 발주서: 15, 거래명세서: 12 },
    { month: '10월', 견적서: 16, 발주서: 12, 거래명세서: 9 },
    { month: '11월', 견적서: 22, 발주서: 16, 거래명세서: 11 },
  ];

  const revenueData = [
    { month: '5월', amount: 3200000 },
    { month: '6월', amount: 4100000 },
    { month: '7월', amount: 5300000 },
    { month: '8월', amount: 3800000 },
    { month: '9월', amount: 6200000 },
    { month: '10월', amount: 4900000 },
    { month: '11월', amount: 7100000 },
  ];

  const recentActivities = [
    {
      type: 'quotation',
      number: 'QT-2025-028',
      client: '(주)ABC코리아',
      amount: '₩2,300,000',
      date: '2시간 전',
      status: 'completed',
    },
    {
      type: 'purchase-order',
      number: 'PO-2025-015',
      client: '(주)서플라이',
      amount: '₩1,850,000',
      date: '5시간 전',
      status: 'pending',
    },
    {
      type: 'transaction-statement',
      number: 'TS-2025-11',
      client: '디지털솔루션',
      amount: '₩4,200,000',
      date: '1일 전',
      status: 'completed',
    },
    {
      type: 'quotation',
      number: 'QT-2025-027',
      client: '(주)테크노',
      amount: '₩950,000',
      date: '1일 전',
      status: 'completed',
    },
    {
      type: 'purchase-order',
      number: 'PO-2025-014',
      client: '(주)머티리얼',
      amount: '₩3,100,000',
      date: '2일 전',
      status: 'completed',
    },
  ];

  const topClients = [
    { name: '(주)ABC코리아', amount: '₩8,500,000', documents: 12 },
    { name: '디지털솔루션', amount: '₩6,200,000', documents: 8 },
    { name: '(주)테크노', amount: '₩5,800,000', documents: 15 },
    { name: '(주)서플라이', amount: '₩4,900,000', documents: 7 },
    { name: '(주)머티리얼', amount: '₩3,600,000', documents: 5 },
  ];

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'quotation':
        return FileText;
      case 'purchase-order':
        return FileCheck;
      case 'transaction-statement':
        return Receipt;
      default:
        return FileText;
    }
  };

  const formatCurrency = (value: number) => {
    return `₩${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">대시보드</h1>
          <p className="text-gray-600">비즈니스 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onNavigate('quotation')}>
            <FileText className="w-4 h-4 mr-2" />
            견적서 작성
          </Button>
          <Button onClick={() => onNavigate('purchase-order')}>
            <Plus className="w-4 h-4 mr-2" />
            새 문서
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Documents Chart */}
        <Card>
          <CardHeader>
            <CardTitle>월별 문서 작성 현황</CardTitle>
            <CardDescription>최근 7개월 문서 작성 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="견적서" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="발주서" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="거래명세서" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>월별 거래액</CardTitle>
            <CardDescription>최근 7개월 거래액 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip 
                  formatter={(value: number) => `₩${value.toLocaleString()}`}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>문서 유형별 분포</CardTitle>
            <CardDescription>전체 문서 통계</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {documentTypeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}개</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>최근 작성된 문서 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = getDocumentIcon(activity.type);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{activity.number}</span>
                          <Badge 
                            variant={activity.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {activity.status === 'completed' ? '완료' : '대기중'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{activity.client}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600 mb-1">{activity.amount}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>주요 거래처</CardTitle>
          <CardDescription>거래액 기준 상위 거래처</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.documents}개 문서</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">{client.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
