import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuotationPage } from './components/QuotationPage';
import { PurchaseOrderPage } from './components/PurchaseOrderPage';
// Transaction Statement Page
// import { TransactionStatementPage } from './components/TransactionStatementPage';
import { TransactionStatementPage } from './components/TransactionStatementPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { DashboardPage } from './components/DashboardPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { getSession, getUserProfile, signOut, updateSubscription, UserProfile } from './utils/auth';

type Page = 'home' | 'quotation' | 'purchase-order' | 'transaction-statement' | 'subscription' | 'dashboard' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await getSession();
    if (session?.access_token) {
      setIsAuthenticated(true);
      setAccessToken(session.access_token);
      const profile = await getUserProfile(session.access_token);
      setUserProfile(profile);
    }
  };

  const handleAuthSuccess = async () => {
    await checkAuth();
    setCurrentPage('dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setAccessToken(null);
    setCurrentPage('home');
  };

  const handleUpgrade = async (plan: string) => {
    if (!accessToken) return;
    
    try {
      const updatedProfile = await updateSubscription(accessToken, plan);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  const handleNavigate = (page: Page) => {
    // Require auth for document pages
    if (['quotation', 'purchase-order', 'transaction-statement', 'subscription', 'dashboard', 'settings'].includes(page) && !isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
      
      {currentPage === 'home' && <Hero onNavigate={handleNavigate} />}
      {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentPage === 'quotation' && <QuotationPage />}
      {currentPage === 'purchase-order' && <PurchaseOrderPage />}
      {currentPage === 'transaction-statement' && <TransactionStatementPage />}
      {currentPage === 'subscription' && userProfile && (
        <SubscriptionPage profile={userProfile} onUpgrade={handleUpgrade} />
      )}
      {currentPage === 'settings' && <SettingsPage />}

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
