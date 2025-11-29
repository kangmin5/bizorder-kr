import { Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserProfile } from '../utils/auth';

interface SubscriptionPageProps {
  profile: UserProfile;
  onUpgrade: (plan: string) => void;
}

export function SubscriptionPage({ profile, onUpgrade }: SubscriptionPageProps) {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₩0',
      period: '무료',
      description: '개인 사용자를 위한 기본 플랜',
      features: [
        { text: '월 10개 문서', included: true },
        { text: '기본 템플릿', included: true },
        { text: 'PDF 다운로드', included: true },
        { text: '이메일 지원', included: true },
        { text: '고급 템플릿', included: false },
        { text: '팀 협업', included: false },
        { text: 'API 접근', included: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '₩29,000',
      period: '월',
      description: '소규모 비즈니스를 위한 플랜',
      features: [
        { text: '월 100개 문서', included: true },
        { text: '모든 템플릿', included: true },
        { text: 'PDF 다운로드', included: true },
        { text: '이메일 지원', included: true },
        { text: '고급 템플릿', included: true },
        { text: '팀 협업 (5명)', included: true },
        { text: 'API 접근', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₩79,000',
      period: '월',
      description: '성장하는 비즈니스를 위한 플랜',
      features: [
        { text: '무제한 문서', included: true },
        { text: '모든 템플릿', included: true },
        { text: 'PDF 다운로드', included: true },
        { text: '우선 지원', included: true },
        { text: '고급 템플릿', included: true },
        { text: '팀 협업 (20명)', included: true },
        { text: 'API 접근', included: true },
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '맞춤형',
      period: '상담',
      description: '대기업을 위한 맞춤형 솔루션',
      features: [
        { text: '무제한 문서', included: true },
        { text: '맞춤형 템플릿', included: true },
        { text: 'PDF 다운로드', included: true },
        { text: '전담 지원', included: true },
        { text: '고급 템플릿', included: true },
        { text: '무제한 팀 협업', included: true },
        { text: 'API 접근', included: true },
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-gray-900 mb-4">구독 관리</h1>
        <p className="text-xl text-gray-600 mb-4">
          현재 플랜: <Badge variant="default">{profile.plan.toUpperCase()}</Badge>
        </p>
        <p className="text-gray-600">
          비즈니스에 맞는 플랜을 선택하세요
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular ? 'border-blue-500 border-2 shadow-lg' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500">인기</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {profile.plan === plan.id ? (
                <Button variant="outline" className="w-full" disabled>
                  현재 플랜
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => onUpgrade(plan.id)}
                >
                  {plan.id === 'enterprise' ? '문의하기' : '업그레이드'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          플랜 변경은 언제든지 가능하며, 즉시 적용됩니다.
        </p>
        <p className="text-gray-600">
          Enterprise 플랜에 대해 궁금하신 점이 있으시면{' '}
          <a href="mailto:sales@bizorder.kr" className="text-blue-600 hover:underline">
            sales@bizorder.kr
          </a>
          로 문의해주세요.
        </p>
      </div>
    </div>
  );
}
