import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Organization profile interface
export interface OrganizationProfile {
  full_name: string;
  organization_name: string;
  organization_type: string;
  focus_areas: string[]; // Array of focus areas
  location_state: string;
  location_county: string;
  grant_amount_min: number | null;
  grant_amount_max: number | null;
  keywords: string[]; // Array of keywords
}

interface ProfileState {
  profile: OrganizationProfile | null;
  updateProfile: (data: Partial<OrganizationProfile>) => void;
  clearProfile: () => void;
  hasProfile: () => boolean;
}

// Default empty profile
const defaultProfile: OrganizationProfile = {
  full_name: '',
  organization_name: '',
  organization_type: '',
  focus_areas: [],
  location_state: '',
  location_county: '',
  grant_amount_min: null,
  grant_amount_max: null,
  keywords: [],
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      
      updateProfile: (data: Partial<OrganizationProfile>) => {
        const currentProfile = get().profile || defaultProfile;
        const updatedProfile: OrganizationProfile = {
          ...currentProfile,
          ...data,
          // Ensure arrays are arrays
          focus_areas: data.focus_areas || currentProfile.focus_areas || [],
          keywords: data.keywords || currentProfile.keywords || [],
        };
        set({ profile: updatedProfile });
      },
      
      clearProfile: () => {
        set({ profile: null });
      },
      
      hasProfile: () => {
        const profile = get().profile;
        if (!profile) return false;
        // Consider profile complete if at least organization name or focus areas are set
        return !!(profile.organization_name || profile.focus_areas?.length > 0);
      },
    }),
    {
      name: 'profile-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

