import { CreateBidInput, BidCalculationResult } from '@seamless/shared';

interface BidConfig {
  baseRates: {
    BASIC: number;
    STANDARD: number;
    PREMIUM: number;
    LUXURY: number;
  };
  roomRate: number;
  bathroomRate: number;
  services: {
    deepClean: number;
    pestControl: number;
    flooringRepair: number;
    lawnCare: number;
    maintenance: number;
    deodorize: number;
  };
  rushThresholds: {
    urgent: number; // days
    rush: number;
    normal: number;
  };
  multipliers: {
    urgent: number;
    rush: number;
    normal: number;
  };
  margins: {
    BASIC: number;
    STANDARD: number;
    PREMIUM: number;
    LUXURY: number;
  };
  overhead: number; // percentage
  localMultiplier?: number; // org-specific price multiplier
}

const defaultConfig: BidConfig = {
  baseRates: {
    BASIC: 0.08,      // $0.08 per sqft
    STANDARD: 0.12,   // $0.12 per sqft
    PREMIUM: 0.18,    // $0.18 per sqft
    LUXURY: 0.25,     // $0.25 per sqft
  },
  roomRate: 25,        // $25 per room
  bathroomRate: 35,    // $35 per bathroom
  services: {
    deepClean: 150,
    pestControl: 200,
    flooringRepair: 500,
    lawnCare: 100,
    maintenance: 250,
    deodorize: 125,
  },
  rushThresholds: {
    urgent: 3,
    rush: 7,
    normal: 14,
  },
  multipliers: {
    urgent: 1.5,
    rush: 1.25,
    normal: 1.0,
  },
  margins: {
    BASIC: 0.20,      // 20% margin
    STANDARD: 0.25,   // 25% margin
    PREMIUM: 0.30,    // 30% margin
    LUXURY: 0.35,     // 35% margin
  },
  overhead: 0.15,      // 15% overhead
};

export class BidCalculator {
  private config: BidConfig;
  
  constructor(localMultiplier: number = 1.0) {
    this.config = {
      ...defaultConfig,
      localMultiplier,
    };
  }
  
  calculate(input: CreateBidInput): BidCalculationResult {
    const {
      squareFeet,
      rooms,
      bathrooms = 1,
      daysTarget,
      tier,
      deepClean = false,
      pestControl = false,
      flooringRepair = false,
      lawnCare = false,
      maintenance = false,
      deodorize = false,
    } = input;
    
    // Calculate base price
    const sqftRate = this.config.baseRates[tier];
    const sqftPrice = squareFeet * sqftRate;
    const roomPrice = rooms * this.config.roomRate;
    const bathroomPrice = bathrooms * this.config.bathroomRate;
    
    let basePrice = sqftPrice + roomPrice + bathroomPrice;
    
    // Add service costs
    const services: Record<string, number> = {};
    let totalServiceCost = 0;
    
    if (deepClean) {
      services.deepClean = this.config.services.deepClean;
      totalServiceCost += services.deepClean;
    }
    if (pestControl) {
      services.pestControl = this.config.services.pestControl;
      totalServiceCost += services.pestControl;
    }
    if (flooringRepair) {
      services.flooringRepair = this.config.services.flooringRepair;
      totalServiceCost += services.flooringRepair;
    }
    if (lawnCare) {
      services.lawnCare = this.config.services.lawnCare;
      totalServiceCost += services.lawnCare;
    }
    if (maintenance) {
      services.maintenance = this.config.services.maintenance;
      totalServiceCost += services.maintenance;
    }
    if (deodorize) {
      services.deodorize = this.config.services.deodorize;
      totalServiceCost += services.deodorize;
    }
    
    basePrice += totalServiceCost;
    
    // Calculate rush multiplier
    let rushMultiplier = this.config.multipliers.normal;
    if (daysTarget <= this.config.rushThresholds.urgent) {
      rushMultiplier = this.config.multipliers.urgent;
    } else if (daysTarget <= this.config.rushThresholds.rush) {
      rushMultiplier = this.config.multipliers.rush;
    }
    
    // Calculate risk factor based on job complexity
    let riskFactor = 1.0;
    const serviceCount = Object.keys(services).length;
    if (serviceCount >= 4) {
      riskFactor = 1.15; // High complexity
    } else if (serviceCount >= 2) {
      riskFactor = 1.08; // Medium complexity
    }
    
    // Large property risk
    if (squareFeet > 5000) {
      riskFactor *= 1.1;
    }
    
    // Apply multipliers
    const adjustedPrice = basePrice * rushMultiplier * riskFactor;
    
    // Add overhead
    const overhead = adjustedPrice * this.config.overhead;
    
    // Add margin
    const margin = adjustedPrice * this.config.margins[tier];
    
    // Calculate total with local multiplier
    let totalPrice = (adjustedPrice + overhead + margin) * (this.config.localMultiplier || 1.0);
    
    // Round to nearest $5
    totalPrice = Math.round(totalPrice / 5) * 5;
    
    // Breakdown for transparency
    const laborPercent = 0.5; // 50% labor
    const materialsPercent = 0.3; // 30% materials  
    const equipmentPercent = 0.2; // 20% equipment
    
    const breakdown = {
      labor: basePrice * laborPercent,
      materials: basePrice * materialsPercent,
      equipment: basePrice * equipmentPercent,
      services,
    };
    
    return {
      basePrice: Math.round(basePrice * 100) / 100,
      rushMultiplier,
      riskFactor,
      overhead: Math.round(overhead * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      totalPrice,
      breakdown,
    };
  }
  
  // AI-ready method for future LLM integration
  async calculateWithAI(input: CreateBidInput, context?: any): Promise<BidCalculationResult> {
    // For now, use heuristic calculation
    const result = this.calculate(input);
    
    // In future, this would:
    // 1. Send context to LLM
    // 2. Get pricing adjustments based on market data
    // 3. Factor in historical job performance
    // 4. Consider competitor pricing
    // 5. Optimize for conversion probability
    
    return result;
  }
  
  // Update local multiplier based on market conditions
  updateLocalMultiplier(multiplier: number): void {
    this.config.localMultiplier = multiplier;
  }
  
  // Get suggested price adjustments
  getSuggestions(result: BidCalculationResult): string[] {
    const suggestions: string[] = [];
    
    if (result.rushMultiplier > 1.25) {
      suggestions.push('Consider offering a standard timeline option for a lower price');
    }
    
    if (result.totalPrice > 2000) {
      suggestions.push('Large job - consider offering payment plans or phased work');
    }
    
    if (result.riskFactor > 1.1) {
      suggestions.push('Complex job - ensure clear scope definition and consider adding contingency');
    }
    
    return suggestions;
  }
}