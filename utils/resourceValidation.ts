import { Resource, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';

export interface ResourceValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ResourceValidationResult {
  isValid: boolean;
  errors: ResourceValidationError[];
  warnings: string[];
}

export class ResourceValidator {
  private static readonly VALIDATION_RULES = {
    name: {
      required: true
    },
    description: {
      required: false
    },
    totalQuantity: {
      required: true,
      min: 1,
      max: 999,
      message: 'Total quantity must be between 1 and 999'
    },
    availableQuantity: {
      required: true,
      min: 0,
      message: 'Available quantity cannot be negative'
    },
    location: {
      required: false,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_&().,]+$/,
      message: 'Location must contain only letters, numbers, spaces, and common punctuation'
    },
    tags: {
      required: false,
      maxLength: 200,
      pattern: /^[a-zA-Z0-9\s\-_,]+$/,
      message: 'Tags must contain only letters, numbers, spaces, hyphens, underscores, and commas'
    }
  };

  static validateResource(resource: Partial<Resource>): ResourceValidationResult {
    const errors: ResourceValidationError[] = [];
    const warnings: string[] = [];

    // Validate name
    this.validateName(resource.name, errors);
    
    // Validate description
    this.validateDescription(resource.description, errors, warnings);
    
    // Validate quantities
    this.validateQuantities(resource.totalQuantity, resource.availableQuantity, errors, warnings);
    
    // Validate location
    this.validateLocation(resource.location, errors, warnings);
    
    // Validate tags
    this.validateTags(resource.tags, errors, warnings);
    
    // Validate category
    this.validateCategory(resource.category, errors);
    
    // Validate condition
    this.validateCondition(resource.condition, errors);
    
    // Validate status
    this.validateStatus(resource.status, errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateName(name: string | undefined, errors: ResourceValidationError[]): void {
    const rules = this.VALIDATION_RULES.name;
    
    if (!name) {
      if (rules.required) {
        errors.push({
          field: 'name',
          message: 'Resource name is required',
          code: 'REQUIRED'
        });
      }
      return;
    }

    // Only check if name is not empty (trimmed)
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      errors.push({
        field: 'name',
        message: 'Resource name cannot be empty',
        code: 'REQUIRED'
      });
    }
  }

  private static validateDescription(description: string | undefined, errors: ResourceValidationError[], warnings: string[]): void {
    // Description is optional and has no character limit
    if (!description || !description.trim()) {
      return; // Description is optional
    }
  }

  private static validateQuantities(totalQuantity: number | undefined, availableQuantity: number | undefined, errors: ResourceValidationError[], warnings: string[]): void {
    const totalRules = this.VALIDATION_RULES.totalQuantity;
    const availableRules = this.VALIDATION_RULES.availableQuantity;
    
    // Validate total quantity
    if (totalQuantity === undefined || totalQuantity === null) {
      if (totalRules.required) {
        errors.push({
          field: 'totalQuantity',
          message: 'Total quantity is required',
          code: 'REQUIRED'
        });
      }
    } else {
      if (totalQuantity < totalRules.min) {
        errors.push({
          field: 'totalQuantity',
          message: `Total quantity must be at least ${totalRules.min}`,
          code: 'MIN_VALUE'
        });
      }
      
      if (totalQuantity > totalRules.max) {
        errors.push({
          field: 'totalQuantity',
          message: `Total quantity cannot exceed ${totalRules.max}`,
          code: 'MAX_VALUE'
        });
      }
    }
    
    // Validate available quantity
    if (availableQuantity === undefined || availableQuantity === null) {
      if (availableRules.required) {
        errors.push({
          field: 'availableQuantity',
          message: 'Available quantity is required',
          code: 'REQUIRED'
        });
      }
    } else {
      if (availableQuantity < availableRules.min) {
        errors.push({
          field: 'availableQuantity',
          message: 'Available quantity cannot be negative',
          code: 'MIN_VALUE'
        });
      }
    }
    
    // Cross-validation
    if (totalQuantity !== undefined && availableQuantity !== undefined) {
      if (availableQuantity > totalQuantity) {
        errors.push({
          field: 'availableQuantity',
          message: 'Available quantity cannot exceed total quantity',
          code: 'INVALID_RELATIONSHIP'
        });
      }
      
      if (availableQuantity < totalQuantity && availableQuantity === 0) {
        warnings.push('All items are currently borrowed. Consider adding more units.');
      }
    }
  }

  private static validateLocation(location: string | undefined, errors: ResourceValidationError[], warnings: string[]): void {
    const rules = this.VALIDATION_RULES.location;
    
    if (!location) {
      return; // Location is optional
    }

    const trimmedLocation = location.trim();
    
    if (trimmedLocation.length > rules.maxLength) {
      errors.push({
        field: 'location',
        message: `Location must be no more than ${rules.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }
    
    if (trimmedLocation.length > 0 && !rules.pattern.test(trimmedLocation)) {
      errors.push({
        field: 'location',
        message: rules.message,
        code: 'INVALID_FORMAT'
      });
    }
  }

  private static validateTags(tags: string[] | undefined, errors: ResourceValidationError[], warnings: string[]): void {
    const rules = this.VALIDATION_RULES.tags;
    
    if (!tags || tags.length === 0) {
      return; // Tags are optional
    }

    const allTags = tags.join(', ');
    
    if (allTags.length > rules.maxLength) {
      errors.push({
        field: 'tags',
        message: `Tags must be no more than ${rules.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }
    
    if (!rules.pattern.test(allTags)) {
      errors.push({
        field: 'tags',
        message: rules.message,
        code: 'INVALID_FORMAT'
      });
    }
    
    if (tags.length > 10) {
      warnings.push('Consider using fewer, more specific tags for better organization.');
    }
  }

  private static validateCategory(category: ResourceCategory | undefined, errors: ResourceValidationError[]): void {
    const validCategories: ResourceCategory[] = [
      'vehicles', 'medical', 'equipment', 'communication', 
      'personnel', 'tools', 'supplies', 'other'
    ];
    
    if (!category) {
      errors.push({
        field: 'category',
        message: 'Category is required',
        code: 'REQUIRED'
      });
    } else if (!validCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: 'Invalid category selected',
        code: 'INVALID_VALUE'
      });
    }
  }

  private static validateCondition(condition: ResourceCondition | undefined, errors: ResourceValidationError[]): void {
    const validConditions: ResourceCondition[] = [
      'excellent', 'good', 'fair', 'poor', 'needs_repair'
    ];
    
    if (!condition) {
      errors.push({
        field: 'condition',
        message: 'Condition is required',
        code: 'REQUIRED'
      });
    } else if (!validConditions.includes(condition)) {
      errors.push({
        field: 'condition',
        message: 'Invalid condition selected',
        code: 'INVALID_VALUE'
      });
    }
  }

  private static validateStatus(status: ResourceStatus | undefined, errors: ResourceValidationError[]): void {
    const validStatuses: ResourceStatus[] = [
      'active', 'inactive', 'maintenance', 'retired'
    ];
    
    if (!status) {
      errors.push({
        field: 'status',
        message: 'Status is required',
        code: 'REQUIRED'
      });
    } else if (!validStatuses.includes(status)) {
      errors.push({
        field: 'status',
        message: 'Invalid status selected',
        code: 'INVALID_VALUE'
      });
    }
  }

  static sanitizeResourceData(resource: Partial<Resource>): Partial<Resource> {
    return {
      ...resource,
      name: resource.name?.trim(),
      description: resource.description?.trim(),
      location: resource.location?.trim(),
      tags: resource.tags?.map(tag => tag.trim()).filter(tag => tag.length > 0),
    };
  }

  static getValidationSummary(result: ResourceValidationResult): string {
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
