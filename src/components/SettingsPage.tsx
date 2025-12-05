import {
  Image,
  LogOut,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useSettingsStore } from "../stores/useSettingsStore";
import { toast } from "sonner";

export function SettingsPage() {
  const { 
    companyInfo, setCompanyInfo,
    userInfo, setUserInfo,
    bannerSettings, setBannerSettings,
    taxSettings, setTaxSettings
  } = useSettingsStore();


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'stamp') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'banner') {
          setBannerSettings({ bannerImage: reader.result as string });
        } else {
          setBannerSettings({ stampImage: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (section: string) => {
    toast.success(`${section} 저장 완료`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">회사 정보와 계정 설정을 관리하세요</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">회사정보</TabsTrigger>
          <TabsTrigger value="banner">회사배너</TabsTrigger>
          <TabsTrigger value="tax">세금계산서</TabsTrigger>
          <TabsTrigger value="profile">회원정보</TabsTrigger>
          <TabsTrigger value="withdraw">회원탈퇴</TabsTrigger>
        </TabsList>

        {/* 회사 정보 탭 */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>회사 정보</CardTitle>
              <CardDescription>사업자 등록증 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">
                    회사명 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company-name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ name: e.target.value })}
                    placeholder="(주)비즈오더"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ceo-name">
                    대표자 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="ceo-name" 
                    value={companyInfo.ceoName}
                    onChange={(e) => setCompanyInfo({ ceoName: e.target.value })}
                    placeholder="홍길동" 
                    required 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-number">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business-number"
                    value={companyInfo.businessNumber}
                    onChange={(e) => setCompanyInfo({ businessNumber: e.target.value })}
                    placeholder="123-45-67890"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company-regist-num">법인등록번호</Label>
                  <Input
                    id="company-regist-num"
                    value={companyInfo.corporateNumber}
                    onChange={(e) => setCompanyInfo({ corporateNumber: e.target.value })}
                    placeholder="법인사업자인 경우 입력"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-type">
                    업태 <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="business-type" 
                    value={companyInfo.businessType}
                    onChange={(e) => setCompanyInfo({ businessType: e.target.value })}
                    placeholder="서비스" 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="business-item">
                    종목 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business-item"
                    value={companyInfo.businessItem}
                    onChange={(e) => setCompanyInfo({ businessItem: e.target.value })}
                    placeholder="소프트웨어 개발"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ address: e.target.value })}
                  placeholder="서울시 강남구 테헤란로 123"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">전화번호</Label>
                  <Input 
                    id="phone" 
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ phone: e.target.value })}
                    placeholder="02-1234-5678" 
                  />
                </div>
                <div>
                  <Label htmlFor="fax">팩스</Label>
                  <Input 
                    id="fax" 
                    value={companyInfo.fax}
                    onChange={(e) => setCompanyInfo({ fax: e.target.value })}
                    placeholder="02-1234-5679" 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo({ email: e.target.value })}
                  placeholder="contact@bizorder.kr"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('회사정보')}>저장하기</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 회사 배너 탭 */}
        <TabsContent value="banner">
          <Card>
            <CardHeader>
              <CardTitle>회사 배너 및 로고</CardTitle>
              <CardDescription>
                문서 및 대시보드에 표시될 이미지를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>배너 위치</Label>
                  <Select
                    value={bannerSettings.position}
                    onValueChange={(v) => setBannerSettings({ position: v as 'top' | 'right' | 'left' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="배너 위치 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">제목 상단</SelectItem>
                      <SelectItem value="right">제목 우측</SelectItem>
                      <SelectItem value="left">제목 좌측</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>회사 배너</Label>
                  <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50 border-dashed">
                    <div className="w-full h-32 bg-white rounded border flex items-center justify-center text-gray-300 overflow-hidden relative">
                      {bannerSettings.bannerImage ? (
                        <img 
                          src={bannerSettings.bannerImage} 
                          alt="배너 미리보기" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="w-12 h-12" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        {bannerSettings.position === "top"
                          ? "견적서 상단에 표시될 배너 이미지를 업로드하세요 (권장 크기: 1200px x 128px, PNG,JPG)"
                          : "제목 옆에 표시될 배너 이미지를 업로드하세요 (권장 크기: 400x150px)"}
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs"
                        onChange={(e) => handleImageChange(e, 'banner')}
                      />
                    </div>
                  </div>
                </div>
                <Separator />

                <div className="space-y-2">
                  <Label>회사 도장(직인)이미지</Label>
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 border-dashed">
                    <div className="w-24 h-24 bg-white rounded border flex items-center justify-center text-gray-300 overflow-hidden relative">
                      {bannerSettings.stampImage ? (
                        <img 
                          src={bannerSettings.stampImage} 
                          alt="도장 미리보기" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image className="w-8 h-8" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        도장 이미지를 업로드하세요 (배경 투명 권장, 크기: 120x120px)
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        className="max-w-xs"
                        onChange={(e) => handleImageChange(e, 'stamp')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('배너 설정')}>이미지 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 세금계산서 탭 */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>세금계산서 설정</CardTitle>
              <CardDescription>
                전자세금계산서 발행을 위한 정보를 설정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="auto-issue" 
                    checked={taxSettings.autoIssue}
                    onCheckedChange={(checked) => setTaxSettings({ autoIssue: !!checked })}
                  />
                  <Label htmlFor="auto-issue">
                    결제 완료 시 자동으로 세금계산서 발행
                  </Label>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax-manager">세금계산서 담당자명</Label>
                    <Input 
                      id="tax-manager" 
                      value={taxSettings.managerName}
                      onChange={(e) => setTaxSettings({ managerName: e.target.value })}
                      placeholder="담당자 이름" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax-email">발행용 이메일</Label>
                    <Input
                      id="tax-email"
                      type="email"
                      value={taxSettings.email}
                      onChange={(e) => setTaxSettings({ email: e.target.value })}
                      placeholder="tax@company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tax-cert">공동인증서 등록</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-5 h-5" />
                      <span>등록된 인증서가 없습니다</span>
                    </div>
                    <Button variant="outline" size="sm">
                      인증서 등록
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('세금계산서 설정')}>설정 저장</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 회원정보 탭 */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>회원 정보</CardTitle>
              <CardDescription>
                개인 정보 및 로그인 설정을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-name">이름</Label>
                  <Input 
                    id="user-name" 
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ name: e.target.value })}
                    placeholder="홍길동" 
                  />
                </div>
                <div>
                  <Label htmlFor="user-department">부서/팀</Label>
                  <Input 
                    id="user-department" 
                    value={userInfo.department}
                    onChange={(e) => setUserInfo({ department: e.target.value })}
                    placeholder="경영지원팀" 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-position">직위/직책</Label>
                  <Input 
                    id="user-position" 
                    value={userInfo.position}
                    onChange={(e) => setUserInfo({ position: e.target.value })}
                    placeholder="대표" 
                  />
                </div>
                <div>
                  <Label htmlFor="user-phone">휴대전화</Label>
                  <Input 
                    id="user-phone" 
                    value={userInfo.mobile}
                    onChange={(e) => setUserInfo({ mobile: e.target.value })}
                    placeholder="010-1234-5678" 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="user-email">이메일 (아이디)</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ email: e.target.value })}
                  placeholder="user@example.com"
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  로그인 이메일은 변경할 수 없습니다.
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">비밀번호 변경</h3>
                <div>
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-password">새 비밀번호</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSave('회원정보')}>정보 수정</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 회원탈퇴 탭 */}
        <TabsContent value="withdraw">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">회원 탈퇴</CardTitle>
              <CardDescription className="text-red-600/80">
                탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-confirm" className="text-red-700">
                  탈퇴를 확인하기 위해 "탈퇴하겠습니다"라고 입력해 주세요.
                </Label>
                <Input
                  id="withdraw-confirm"
                  placeholder="탈퇴하겠습니다"
                  className="border-red-200 focus-visible:ring-red-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="withdraw-agree"
                  className="data-[state=checked]:bg-red-600 border-red-400"
                />
                <Label htmlFor="withdraw-agree" className="text-red-700">
                  모든 데이터 삭제에 동의합니다.
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                회원 탈퇴하기
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
