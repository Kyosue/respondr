import { Resource } from '@/types/Resource';

export interface MaintenanceSchedule {
  resourceId: string;
  resourceName: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  isOverdue: boolean;
  daysUntilDue: number;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'cleaning' | 'calibration';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class MaintenanceUtils {
  // Default maintenance intervals in days
  private static readonly MAINTENANCE_INTERVALS = {
    vehicles: 90, // 3 months
    medical: 30, // 1 month
    equipment: 60, // 2 months
    communication: 45, // 1.5 months
    personnel: 0, // No maintenance needed
    tools: 30, // 1 month
    supplies: 0, // No maintenance needed
    other: 90, // 3 months
  };

  // Priority levels based on condition and usage
  private static readonly PRIORITY_RULES = {
    needs_repair: 'critical',
    poor: 'high',
    fair: 'medium',
    good: 'low',
    excellent: 'low',
  };

  static calculateNextMaintenance(resource: Resource): Date | null {
    if (!resource.lastMaintenance) {
      // If no last maintenance, schedule for next interval from now
      const interval = this.MAINTENANCE_INTERVALS[resource.category];
      if (interval === 0) return null; // No maintenance needed
      
      const nextMaintenance = new Date();
      nextMaintenance.setDate(nextMaintenance.getDate() + interval);
      return nextMaintenance;
    }

    const lastMaintenance = resource.lastMaintenance instanceof Date 
      ? resource.lastMaintenance 
      : new Date(resource.lastMaintenance);
    
    const interval = this.MAINTENANCE_INTERVALS[resource.category];
    if (interval === 0) return null; // No maintenance needed

    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setDate(nextMaintenance.getDate() + interval);
    return nextMaintenance;
  }

  static getMaintenanceSchedule(resources: Resource[]): MaintenanceSchedule[] {
    const now = new Date();
    
    return resources
      .map(resource => {
        const nextMaintenance = this.calculateNextMaintenance(resource);
        const isOverdue = nextMaintenance ? nextMaintenance <= now : false;
        const daysUntilDue = nextMaintenance 
          ? Math.ceil((nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const priority = this.PRIORITY_RULES[resource.condition] as MaintenanceSchedule['priority'];
        
        return {
          resourceId: resource.id,
          resourceName: resource.name,
          lastMaintenance: resource.lastMaintenance,
          nextMaintenance,
          isOverdue,
          daysUntilDue,
          maintenanceType: this.getMaintenanceType(resource.category),
          priority: isOverdue ? 'critical' : priority,
        };
      })
      .filter(schedule => schedule.nextMaintenance !== null) // Only include resources that need maintenance
      .sort((a, b) => {
        // Sort by priority: overdue first, then by days until due
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntilDue - b.daysUntilDue;
      });
  }

  private static getMaintenanceType(category: Resource['category']): MaintenanceSchedule['maintenanceType'] {
    switch (category) {
      case 'vehicles':
        return 'routine';
      case 'medical':
        return 'inspection';
      case 'equipment':
        return 'calibration';
      case 'communication':
        return 'inspection';
      case 'tools':
        return 'cleaning';
      default:
        return 'routine';
    }
  }

  static getMaintenanceStats(resources: Resource[]): {
    totalDue: number;
    overdue: number;
    dueThisWeek: number;
    dueThisMonth: number;
    critical: number;
  } {
    const schedule = this.getMaintenanceSchedule(resources);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      totalDue: schedule.length,
      overdue: schedule.filter(s => s.isOverdue).length,
      dueThisWeek: schedule.filter(s => s.nextMaintenance && s.nextMaintenance <= oneWeekFromNow && !s.isOverdue).length,
      dueThisMonth: schedule.filter(s => s.nextMaintenance && s.nextMaintenance <= oneMonthFromNow && !s.isOverdue).length,
      critical: schedule.filter(s => s.priority === 'critical').length,
    };
  }

  static shouldScheduleMaintenance(resource: Resource): boolean {
    const interval = this.MAINTENANCE_INTERVALS[resource.category];
    if (interval === 0) return false; // No maintenance needed

    if (!resource.lastMaintenance) return true; // Never maintained

    const lastMaintenance = resource.lastMaintenance instanceof Date 
      ? resource.lastMaintenance 
      : new Date(resource.lastMaintenance);
    
    const daysSinceLastMaintenance = Math.floor(
      (Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastMaintenance >= interval;
  }

  static getMaintenanceRecommendation(resource: Resource): string {
    const condition = resource.condition;
    const category = resource.category;
    
    if (condition === 'needs_repair') {
      return 'Immediate repair required. Resource is not functional.';
    }
    
    if (condition === 'poor') {
      return 'Schedule repair soon. Resource has significant wear and limited functionality.';
    }
    
    if (condition === 'fair') {
      return 'Schedule maintenance soon. Resource needs attention to prevent further deterioration.';
    }
    
    if (this.shouldScheduleMaintenance(resource)) {
      return `Routine ${this.getMaintenanceType(category)} maintenance is due.`;
    }
    
    return 'Resource is in good condition. No immediate maintenance needed.';
  }
}
