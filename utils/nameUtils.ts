/**
 * Generates a display name from a full name by taking the first and last words
 * @param fullName - The complete full name
 * @returns Display name with first and last words only
 */
export const generateDisplayName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) {
    return '';
  }
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    // Only one name provided
    return nameParts[0];
  } else if (nameParts.length === 2) {
    // Already first and last name
    return nameParts.join(' ');
  } else {
    // Multiple names - take first and last
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  }
};

/**
 * Validates if a full name is valid for display name generation
 * @param fullName - The full name to validate
 * @returns Object with isValid boolean and error message
 */
export const validateFullName = (fullName: string): { isValid: boolean; error?: string } => {
  if (!fullName || !fullName.trim()) {
    return { isValid: false, error: 'Full name is required' };
  }
  
  const trimmed = fullName.trim();
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Full name must be less than 100 characters' };
  }
  
  // Check for valid characters (letters including accented characters, spaces, hyphens, apostrophes, and dots)
  const validNameRegex = /^[\p{L}\s\-'.]+$/u;
  if (!validNameRegex.test(trimmed)) {
    return { isValid: false, error: 'Full name can only contain letters, spaces, hyphens, apostrophes, and dots' };
  }
  
  return { isValid: true };
};
