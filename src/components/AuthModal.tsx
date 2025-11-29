import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { signIn, signUp } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const companyName = formData.get('companyName') as string;

    try {
      await signUp(email, password, name, companyName);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Sign up error:', error);
      alert('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>bizorder.kr</DialogTitle>
          <DialogDescription>
            로그인하거나 새 계정을 만드세요
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">이메일</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signin-password">비밀번호</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '로그인 중...' : '로그인'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-name">이름</Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-company">회사명</Label>
                <Input
                  id="signup-company"
                  name="companyName"
                  type="text"
                  placeholder="(주)비즈오더"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password">비밀번호</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
