import { FileText, User, CreditCard, LogOut, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
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

type Page = 'home' | 'quotation' | 'purchase-order' | 'transaction-statement' | 'subscription' | 'dashboard' | 'settings';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

export function Header({ currentPage, onNavigate, isAuthenticated, userProfile, onSignOut, onOpenAuth }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-blue-600">bizorder.kr</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={currentPage === 'home' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
            >
              홈
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
              >
                대시보드
              </button>
            )}
            <button
              onClick={() => onNavigate('quotation')}
              className={currentPage === 'quotation' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
            >
              견적서
            </button>
            <button
              onClick={() => onNavigate('purchase-order')}
              className={currentPage === 'purchase-order' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
            >
              발주서
            </button>
            <button
              onClick={() => onNavigate('transaction-statement')}
              className={currentPage === 'transaction-statement' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
            >
              거래명세서
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('settings')}
                className={currentPage === 'settings' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}
              >
                설정
              </button>
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
                  <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    대시보드
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('subscription')}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    구독 관리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
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
