import type { OrganizationProfile } from './profile-store';

/**
 * Default organization profile for Major League Hacking (MLH) Fellowship users.
 * Aligned with mlh.io and fellowship.mlh.io (education, open source, student hackathons).
 */
export const MLH_DEFAULT_PROFILE: Partial<OrganizationProfile> = {
  organization_name: 'Major League Hacking',
  organization_type: 'Education',
  focus_areas: ['Education', 'Open Source', 'Student hackathons', 'Technology'],
  keywords: ['fellowship', 'hackathon', 'students', 'software engineering', 'open source'],
  full_name: '',
  location_state: '',
  location_county: '',
  grant_amount_min: null,
  grant_amount_max: null,
};

export const MLH_FELLOWSHIP_URL = 'https://fellowship.mlh.io';
export const MLH_IO_URL = 'https://mlh.io';
