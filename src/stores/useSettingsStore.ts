import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export interface CompanyInfo {
  name: string;
  ceoName: string;
  businessNumber: string;
  corporateNumber: string;
  businessType: string;
  businessItem: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
}

export interface UserInfo {
  name: string;
  department: string;
  position: string;
  mobile: string;
  email: string;
}

export interface BannerSettings {
  position: 'top' | 'right' | 'left';
  bannerImage: string | null;
  stampImage: string | null;
}

export interface TaxSettings {
  autoIssue: boolean;
  managerName: string;
  email: string;
}

interface SettingsState {
  // 회사 정보
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: Partial<CompanyInfo>) => void;
  
  // 회원 정보
  userInfo: UserInfo;
  setUserInfo: (info: Partial<UserInfo>) => void;
  
  // 배너 설정
  bannerSettings: BannerSettings;
  setBannerSettings: (settings: Partial<BannerSettings>) => void;
  
  // 세금계산서 설정
  taxSettings: TaxSettings;
  setTaxSettings: (settings: Partial<TaxSettings>) => void;
  
  // 전체 초기화
  resetAll: () => void;
}

// --- Default Values ---

const defaultCompanyInfo: CompanyInfo = {
  name: '',
  ceoName: '',
  businessNumber: '',
  corporateNumber: '',
  businessType: '',
  businessItem: '',
  address: '',
  phone: '',
  fax: '',
  email: '',
};

const defaultUserInfo: UserInfo = {
  name: '',
  department: '',
  position: '',
  mobile: '',
  email: '',
};

const defaultBannerSettings: BannerSettings = {
  position: 'top',
  bannerImage: null,
  stampImage: null,
};

const defaultTaxSettings: TaxSettings = {
  autoIssue: false,
  managerName: '',
  email: '',
};

// --- Store ---

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 회사 정보
      companyInfo: defaultCompanyInfo,
      setCompanyInfo: (info) =>
        set((state) => ({
          companyInfo: { ...state.companyInfo, ...info },
        })),

      // 회원 정보
      userInfo: defaultUserInfo,
      setUserInfo: (info) =>
        set((state) => ({
          userInfo: { ...state.userInfo, ...info },
        })),

      // 배너 설정
      bannerSettings: defaultBannerSettings,
      setBannerSettings: (settings) =>
        set((state) => ({
          bannerSettings: { ...state.bannerSettings, ...settings },
        })),

      // 세금계산서 설정
      taxSettings: defaultTaxSettings,
      setTaxSettings: (settings) =>
        set((state) => ({
          taxSettings: { ...state.taxSettings, ...settings },
        })),

      // 전체 초기화
      resetAll: () =>
        set({
          companyInfo: defaultCompanyInfo,
          userInfo: defaultUserInfo,
          bannerSettings: defaultBannerSettings,
          taxSettings: defaultTaxSettings,
        }),
    }),
    {
      name: 'bizorder-settings', // localStorage 키 이름
    }
  )
);
