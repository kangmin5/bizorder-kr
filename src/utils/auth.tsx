// Mock authentication utility
// In production, this would connect to Supabase

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  companyName: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
}

export const getSession = async () => {
  // Mock session
  const session = localStorage.getItem('session');
  return session ? JSON.parse(session) : null;
};

export const getUserProfile = async (accessToken: string): Promise<UserProfile> => {
  // Mock user profile
  return {
    id: '1',
    email: 'user@example.com',
    name: '홍길동',
    companyName: '(주)비즈오더',
    plan: 'pro'
  };
};

export const signIn = async (email: string, password: string) => {
  // Mock sign in
  const session = {
    access_token: 'mock_token_' + Date.now(),
    user: {
      id: '1',
      email: email
    }
  };
  localStorage.setItem('session', JSON.stringify(session));
  return session;
};

export const signUp = async (email: string, password: string, name: string, companyName: string) => {
  // Mock sign up
  const session = {
    access_token: 'mock_token_' + Date.now(),
    user: {
      id: '1',
      email: email,
      name: name,
      companyName: companyName
    }
  };
  localStorage.setItem('session', JSON.stringify(session));
  return session;
};

export const signOut = async () => {
  localStorage.removeItem('session');
};

export const updateSubscription = async (accessToken: string, plan: string): Promise<UserProfile> => {
  // Mock update subscription
  return {
    id: '1',
    email: 'user@example.com',
    name: '홍길동',
    companyName: '(주)비즈오더',
    plan: plan as 'free' | 'basic' | 'pro' | 'enterprise'
  };
};
