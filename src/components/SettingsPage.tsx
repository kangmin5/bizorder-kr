import { User, Building, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">회사 정보와 계정 설정을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* 회사 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>회사 정보</CardTitle>
            <CardDescription>문서에 표시될 회사 정보를 설정하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">회사명</Label>
                <Input id="company-name" defaultValue="(주)비즈오더" />
              </div>
              <div>
                <Label htmlFor="ceo-name">대표자명</Label>
                <Input id="ceo-name" defaultValue="홍길동" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business-number">사업자등록번호</Label>
                <Input id="business-number" defaultValue="123-45-67890" />
              </div>
              <div>
                <Label htmlFor="business-type">업태</Label>
                <Input id="business-type" defaultValue="도소매업" />
              </div>
            </div>

            <div>
              <Label htmlFor="address">주소</Label>
              <Input id="address" defaultValue="서울시 강남구 테헤란로 123" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input id="phone" defaultValue="02-1234-5678" />
              </div>
              <div>
                <Label htmlFor="fax">팩스</Label>
                <Input id="fax" defaultValue="02-1234-5679" />
              </div>
            </div>

            <div>
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" defaultValue="contact@bizorder.kr" />
            </div>

            <Button>저장하기</Button>
          </CardContent>
        </Card>

        {/* 계정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>로그인 정보를 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-name">이름</Label>
              <Input id="user-name" defaultValue="홍길동" />
            </div>

            <div>
              <Label htmlFor="user-email">이메일</Label>
              <Input id="user-email" type="email" defaultValue="user@example.com" disabled />
              <p className="text-sm text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            <Separator />

            <div>
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input id="current-password" type="password" />
            </div>

            <div>
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" />
            </div>

            <div>
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input id="confirm-password" type="password" />
            </div>

            <Button>비밀번호 변경</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
