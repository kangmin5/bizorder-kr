import { FileText, FileCheck, Receipt, Clock, CheckCircle, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

type Page = 'home' | 'quotation' | 'purchase-order' | 'transaction-statement' | 'subscription';

interface HeroProps {
  onNavigate: (page: Page) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const documents = [
    {
      id: 'quotation' as const,
      icon: FileText,
      title: '견적서',
      description: '전문적인 견적서를 빠르게 작성하고 관리하세요',
      color: 'bg-blue-500',
    },
    {
      id: 'purchase-order' as const,
      icon: FileCheck,
      title: '발주서',
      description: '발주 프로세스를 효율적으로 관리하세요',
      color: 'bg-green-500',
    },
    {
      id: 'transaction-statement' as const,
      icon: Receipt,
      title: '거래명세서',
      description: '거래 내역을 명확하게 기록하고 추적하세요',
      color: 'bg-purple-500',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: '빠른 작성',
      description: '템플릿으로 몇 분 만에 문서 작성',
    },
    {
      icon: CheckCircle,
      title: '회사별 맞춤',
      description: '회사 정보로 자동 완성',
    },
    {
      icon: Users,
      title: '팀 협업',
      description: '팀원과 함께 문서 관리',
    },
  ];

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-gray-900 mb-6">
            비즈니스 문서 관리의 새로운 기준
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            견적서, 발주서, 거래명세서 등 모든 비즈니스 문서를 한 곳에서 관리하세요.
            회사별 맞춤 템플릿으로 더 빠르고 전문적으로.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              무료로 시작하기
            </Button>
            <Button size="lg" variant="outline">
              데모 보기
            </Button>
          </div>
        </div>
      </section>

      {/* Documents Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              필요한 모든 문서 양식
            </h2>
            <p className="text-gray-600">
              클릭하여 각 문서 양식을 살펴보세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {documents.map((doc) => {
              const Icon = doc.icon;
              return (
                <Card
                  key={doc.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                  onClick={() => onNavigate(doc.id)}
                >
                  <CardContent className="p-6">
                    <div className={`${doc.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-gray-600">{doc.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              왜 bizorder.kr인가요?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-600 mb-8">
            14일 무료 체험, 신용카드 등록 불필요
          </p>
          <Button size="lg">
            무료 체험 시작하기
          </Button>
        </div>
      </section>
    </main>
  );
}
