import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { QuotationPage } from './components/QuotationPage';
import { PurchaseOrderPage } from './components/PurchaseOrderPage';
import { TransactionStatementPage } from './components/TransactionStatementPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { DashboardPage } from './components/DashboardPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';
import { getSession, getUserProfile, signOut, updateSubscription, UserProfile } from './utils/auth';

export default function App() {
  const navigate = useNavigate();
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
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setAccessToken(null);
    navigate('/');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isAuthenticated={isAuthenticated}
        userProfile={userProfile}
        onSignOut={handleSignOut}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
      
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/quotation" 
          element={isAuthenticated ? <QuotationPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/purchase-order" 
          element={isAuthenticated ? <PurchaseOrderPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/transaction-statement" 
          element={isAuthenticated ? <TransactionStatementPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/subscription" 
          element={isAuthenticated && userProfile ? (
            <SubscriptionPage profile={userProfile} onUpgrade={handleUpgrade} />
          ) : (
            <Navigate to="/" replace />
          )} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <SettingsPage /> : <Navigate to="/" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
