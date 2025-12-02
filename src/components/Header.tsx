import { FileText, User, CreditCard, LogOut, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { UserProfile } from '../utils/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface HeaderProps {
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

export function Header({ isAuthenticated, userProfile, onSignOut, onOpenAuth }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-blue-600">bizorder.kr</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={isActive('/')}
            >
              홈
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={isActive('/dashboard')}
              >
                대시보드
              </Link>
            )}
            <Link
              to="/quotation"
              className={isActive('/quotation')}
            >
              견적서
            </Link>
            <Link
              to="/purchase-order"
              className={isActive('/purchase-order')}
            >
              발주서
            </Link>
            <Link
              to="/transaction-statement"
              className={isActive('/transaction-statement')}
            >
              거래명세서
            </Link>
            {isAuthenticated && (
              <Link
                to="/settings"
                className={isActive('/settings')}
              >
                설정
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && userProfile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="w-4 h-4" />
                    {userProfile.name}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p>{userProfile.name}</p>
                      <p className="text-gray-500">{userProfile.companyName}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    대시보드
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/subscription')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    구독 관리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={onOpenAuth}>로그인</Button>
                <Button onClick={onOpenAuth}>무료 체험</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
