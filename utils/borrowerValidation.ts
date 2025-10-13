import { BorrowerProfile } from '@/types/Resource';

export interface BorrowerValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BorrowerValidationResult {
  isValid: boolean;
  errors: BorrowerValidationError[];
  warnings: string[];
}

export class BorrowerValidator {
  private static readonly VALIDATION_RULES = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
      message: 'Name must be 2-100 characters and contain only letters, spaces, hyphens, apostrophes, and periods'
    },
    contact: {
      required: false,
      maxLength: 200,
      patterns: {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phone: /^[\+]?[1-9][\d]{0,15}$/,
        message: 'Contact must be a valid email address or phone number'
      }
    },
    department: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_&]+$/,
      message: 'Department must contain only letters, numbers, spaces, hyphens, underscores, and ampersands'
    },
    picture: {
      required: false,
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i,
      message: 'Picture must be a valid image URL (jpg, jpeg, png, gif, or webp)'
    }
  };

  static validateBorrower(borrower: Partial<BorrowerProfile>): BorrowerValidationResult {
    const errors: BorrowerValidationError[] = [];
    const warnings: string[] = [];

    // Validate name
    this.validateName(borrower.name, errors);
    
    // Validate contact
    this.validateContact(borrower.contact, errors, warnings);
    
    // Validate department
    this.validateDepartment(borrower.department, errors, warnings);
    
    // Validate picture
    this.validatePicture(borrower.picture, errors, warnings);
    
    // Validate statistics
    this.validateStatistics(borrower, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateName(name: string | undefined, errors: BorrowerValidationError[]): void {
    const rules = this.VALIDATION_RULES.name;
    
    if (!name) {
      if (rules.required) {
        errors.push({
          field: 'name',
          message: 'Name is required',
          code: 'REQUIRED'
        });
      }
      return;
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < rules.minLength) {
      errors.push({
        field: 'name',
        message: `Name must be at least ${rules.minLength} characters long`,
        code: 'MIN_LENGTH'
      });
    }
    
    if (trimmedName.length > rules.maxLength) {
      errors.push({
        field: 'name',
        message: `Name must be no more than ${rules.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }
    
    if (!rules.pattern.test(trimmedName)) {
      errors.push({
        field: 'name',
        message: rules.message,
        code: 'INVALID_FORMAT'
      });
    }
  }

  private static validateContact(contact: string | undefined, errors: BorrowerValidationError[], warnings: string[]): void {
    const rules = this.VALIDATION_RULES.contact;
    
    if (!contact) {
      return; // Contact is optional
    }

    const trimmedContact = contact.trim();
    
    if (trimmedContact.length > rules.maxLength) {
      errors.push({
        field: 'contact',
        message: `Contact information must be no more than ${rules.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
      return;
    }

    const isEmail = rules.patterns.email.test(trimmedContact);
    const isPhone = rules.patterns.phone.test(trimmedContact.replace(/[\s\-\(\)]/g, ''));
    
    if (!isEmail && !isPhone) {
      errors.push({
        field: 'contact',
        message: rules.patterns.message,
        code: 'INVALID_FORMAT'
      });
    } else if (isPhone && trimmedContact.length < 10) {
      warnings.push('Phone number seems too short. Please verify it\'s correct.');
    }
  }

  private static validateDepartment(department: string | undefined, errors: BorrowerValidationError[], warnings: string[]): void {
    const rules = this.VALIDATION_RULES.department;
    
    if (!department) {
      return; // Department is optional
    }

    const trimmedDepartment = department.trim();
    
    if (trimmedDepartment.length > rules.maxLength) {
      errors.push({
        field: 'department',
        message: `Department must be no more than ${rules.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
      return;
    }
    
    if (!rules.pattern.test(trimmedDepartment)) {
      errors.push({
        field: 'department',
        message: rules.message,
        code: 'INVALID_FORMAT'
      });
    }
  }

  private static validatePicture(picture: string | undefined, errors: BorrowerValidationError[], warnings: string[]): void {
    const rules = this.VALIDATION_RULES.picture;
    
    if (!picture) {
      return; // Picture is optional
    }

    const trimmedPicture = picture.trim();
    
    if (!rules.pattern.test(trimmedPicture)) {
      errors.push({
        field: 'picture',
        message: rules.message,
        code: 'INVALID_FORMAT'
      });
    } else if (!trimmedPicture.startsWith('https://')) {
      warnings.push('Picture URL should use HTTPS for security.');
    }
  }

  private static validateStatistics(borrower: Partial<BorrowerProfile>, errors: BorrowerValidationError[], warnings: string[]): void {
    // Note: Statistics are now calculated in real-time, so we don't validate them here
    // The BorrowerProfile type no longer includes calculated fields like totalBorrowed, activeBorrows, etc.
    // These are calculated dynamically in the ResourceContext
  }

  static sanitizeBorrowerData(borrower: Partial<BorrowerProfile>): Partial<BorrowerProfile> {
    return {
      ...borrower,
      name: borrower.name?.trim(),
      contact: borrower.contact?.trim(),
      department: borrower.department?.trim(),
      picture: borrower.picture?.trim(),
    };
  }

  static validateBorrowerName(name: string): { isValid: boolean; message?: string } {
    const rules = this.VALIDATION_RULES.name;
    
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'Name is required' };
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < rules.minLength) {
      return { isValid: false, message: `Name must be at least ${rules.minLength} characters long` };
    }
    
    if (trimmedName.length > rules.maxLength) {
      return { isValid: false, message: `Name must be no more than ${rules.maxLength} characters long` };
    }
    
    if (!rules.pattern.test(trimmedName)) {
      return { isValid: false, message: rules.message };
    }

    return { isValid: true };
  }

  static validateContactInfo(contact: string): { isValid: boolean; message?: string; type?: 'email' | 'phone' } {
    const rules = this.VALIDATION_RULES.contact;
    
    if (!contact || contact.trim().length === 0) {
      return { isValid: true }; // Contact is optional
    }

    const trimmedContact = contact.trim();
    
    if (trimmedContact.length > rules.maxLength) {
      return { isValid: false, message: `Contact information must be no more than ${rules.maxLength} characters long` };
    }

    const isEmail = rules.patterns.email.test(trimmedContact);
    const isPhone = rules.patterns.phone.test(trimmedContact.replace(/[\s\-\(\)]/g, ''));
    
    if (isEmail) {
      return { isValid: true, type: 'email' };
    } else if (isPhone) {
      return { isValid: true, type: 'phone' };
    } else {
      return { isValid: false, message: rules.patterns.message };
    }
  }

  static getValidationSummary(result: BorrowerValidationResult): string {
    if (result.isValid) {
      if (result.warnings.length > 0) {
        return `Valid with ${result.warnings.length} warning(s)`;
      }
      return 'Valid';
    }
    
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    
    let summary = `${errorCount} error(s)`;
    if (warningCount > 0) {
      summary += ` and ${warningCount} warning(s)`;
    }
    
    return summary;
  }
}
