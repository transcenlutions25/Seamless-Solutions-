import { BidCalculationInput, BidCalculationResult } from '../types';

export class BidCalculator {
  private static readonly BASE_RATES = {
    BASIC: 0.15,      // $0.15 per sq ft
    STANDARD: 0.25,   // $0.25 per sq ft
    PREMIUM: 0.35,    // $0.35 per sq ft
    LUXURY: 0.50      // $0.50 per sq ft
  };

  private static readonly SCOPE_MULTIPLIERS = {
    deepClean: 1.5,
    pestControl: 0.3,
    flooring: 0.4,
    lawnCare: 0.2,
    maintenance: 0.1,
    deodorize: 0.2
  };

  private static readonly RUSH_MULTIPLIERS = {
    1: 2.0,    // Same day
    2: 1.5,    // Next day
    3: 1.2,    // 2-3 days
    7: 1.0     // 1 week
  };

  private static readonly RISK_FACTORS = {
    high: 1.3,    // High risk jobs
    medium: 1.1,  // Medium risk jobs
    low: 1.0      // Low risk jobs
  };

  static calculateBid(input: BidCalculationInput): BidCalculationResult {
    const { squareFootage, rooms, daysTarget, tier, scope, notes } = input;

    // Base price calculation
    const baseRate = this.BASE_RATES[tier];
    let basePrice = squareFootage * baseRate;

    // Room complexity adjustment
    const roomComplexity = Math.max(1, rooms / 2);
    basePrice *= roomComplexity;

    // Scope adjustments
    let scopeMultiplier = 1.0;
    const scopeBreakdown: Record<string, number> = {};

    for (const [service, enabled] of Object.entries(scope)) {
      if (enabled && this.SCOPE_MULTIPLIERS[service as keyof typeof this.SCOPE_MULTIPLIERS]) {
        const multiplier = this.SCOPE_MULTIPLIERS[service as keyof typeof this.SCOPE_MULTIPLIERS];
        scopeMultiplier += multiplier;
        scopeBreakdown[service] = basePrice * multiplier;
      }
    }

    basePrice *= scopeMultiplier;

    // Rush multiplier
    const rushMultiplier = this.getRushMultiplier(daysTarget);

    // Risk factor (based on notes and complexity)
    const riskFactor = this.calculateRiskFactor(notes, scope, rooms);

    // Overhead (fixed 10%)
    const overhead = 0.1;

    // Margin (fixed 20%)
    const margin = 0.2;

    // Calculate total price
    const totalPrice = basePrice * rushMultiplier * riskFactor * (1 + overhead + margin);

    return {
      basePrice: Math.round(basePrice * 100) / 100,
      rushMultiplier,
      riskFactor,
      overhead,
      margin,
      totalPrice: Math.round(totalPrice * 100) / 100,
      breakdown: {
        basePrice: Math.round(basePrice * 100) / 100,
        scopeAdjustment: Math.round((scopeMultiplier - 1) * basePrice * 100) / 100,
        rushAdjustment: Math.round((rushMultiplier - 1) * basePrice * 100) / 100,
        riskAdjustment: Math.round((riskFactor - 1) * basePrice * 100) / 100,
        overhead: Math.round(basePrice * overhead * 100) / 100,
        margin: Math.round(basePrice * margin * 100) / 100,
        ...scopeBreakdown
      }
    };
  }

  private static getRushMultiplier(daysTarget: number): number {
    if (daysTarget <= 1) return this.RUSH_MULTIPLIERS[1];
    if (daysTarget <= 2) return this.RUSH_MULTIPLIERS[2];
    if (daysTarget <= 3) return this.RUSH_MULTIPLIERS[3];
    return this.RUSH_MULTIPLIERS[7];
  }

  private static calculateRiskFactor(notes?: string, scope?: Record<string, boolean>, rooms?: number): number {
    let riskLevel = 'low';

    // Check for high-risk indicators in notes
    if (notes) {
      const highRiskKeywords = ['hazardous', 'damage', 'stain', 'odor', 'pest', 'mold', 'biohazard'];
      const hasHighRisk = highRiskKeywords.some(keyword => 
        notes.toLowerCase().includes(keyword)
      );
      if (hasHighRisk) riskLevel = 'high';
    }

    // Check scope complexity
    if (scope) {
      const complexServices = ['deepClean', 'pestControl', 'deodorize'];
      const hasComplexServices = complexServices.some(service => scope[service]);
      if (hasComplexServices && riskLevel === 'low') riskLevel = 'medium';
    }

    // Check room complexity
    if (rooms && rooms > 5) {
      if (riskLevel === 'low') riskLevel = 'medium';
      else if (riskLevel === 'medium') riskLevel = 'high';
    }

    return this.RISK_FACTORS[riskLevel as keyof typeof this.RISK_FACTORS];
  }

  static validateInput(input: BidCalculationInput): string[] {
    const errors: string[] = [];

    if (!input.squareFootage || input.squareFootage <= 0) {
      errors.push('Square footage must be greater than 0');
    }

    if (!input.rooms || input.rooms <= 0) {
      errors.push('Number of rooms must be greater than 0');
    }

    if (!input.daysTarget || input.daysTarget <= 0) {
      errors.push('Days target must be greater than 0');
    }

    if (!input.tier || !['BASIC', 'STANDARD', 'PREMIUM', 'LUXURY'].includes(input.tier)) {
      errors.push('Invalid tier specified');
    }

    if (!input.scope || typeof input.scope !== 'object') {
      errors.push('Scope must be an object');
    }

    return errors;
  }
}
