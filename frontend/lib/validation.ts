/**
 * Form validation utilities for signup and auth flows.
 */

/** RFC 5322 simplified email regex — covers most valid addresses */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0–5
  label: string;
  criteria: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const MIN_LENGTH = 8;
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const criteria = {
    length: password.length >= MIN_LENGTH,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: SPECIAL_CHARS.test(password),
  };

  const met = Object.values(criteria).filter(Boolean).length;
  let strength: PasswordStrength;
  let label: string;

  if (met === 0 || (met === 1 && !criteria.length)) {
    strength = 'weak';
    label = 'Weak';
  } else if (met <= 2) {
    strength = 'fair';
    label = 'Fair';
  } else if (met <= 4) {
    strength = 'good';
    label = 'Good';
  } else {
    strength = 'strong';
    label = 'Strong';
  }

  return {
    strength,
    score: met,
    label,
    criteria,
  };
}

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { valid: false, message: 'Password is required.' };
  }
  const { criteria } = getPasswordStrength(password);
  if (!criteria.length) {
    return { valid: false, message: 'Password must be at least 8 characters.' };
  }
  if (!criteria.uppercase) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!criteria.lowercase) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }
  if (!criteria.number) {
    return { valid: false, message: 'Password must include at least one number.' };
  }
  if (!criteria.special) {
    return { valid: false, message: 'Password must include at least one special character (!@#$%^&* etc.).' };
  }
  return { valid: true };
}
