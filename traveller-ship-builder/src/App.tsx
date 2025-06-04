import { useState, useEffect } from 'react'

// Define types for hulls, drives, and power plants
interface Hull {
  type: 'Standard' | 'Streamlined' | 'Sphere' | 'Close Structure' | 'Dispersed Structure' | 'Planetoid' | 'Buffered Planetoid';
  size: number;
  specializedType?: 'Reinforced' | 'Light' | 'Military' | 'Non-Gravity';
  additionalType?: 'Double Hull' | 'Hamster Cage' | 'Breakaway Hulls';
  options: {
    heatShielding: boolean;
    radiationShielding: boolean;
    reflec: boolean;
    solarCoating: boolean;
    stealth: {
      type: 'Basic' | 'Improved' | 'Enhanced' | 'Advanced';
    } | undefined;
  };
  armour: {
    type: 'Titanium Steel' | 'Crystaliron' | 'Bonded Superdense' | 'Molecular Bonded';
    protection: number;
  };
  cost: number;
  hullPoints: number;
  minTechLevel: number;
}

interface Drive {
  type: 'Manoeuvre' | 'Jump' | 'Reaction';
  rating: number;
  percentOfHull: number;
  minTechLevel: number;
  costPerTon: number;
  requiresPower: boolean;
}

interface PowerPlant {
  type: 'Fission' | 'Chemical' | 'Fusion' | 'Antimatter';
  techLevel: number;
  powerPerTon: number;
  costPerTon: number;
  canPowerJump: boolean;
}

interface ShipStats {
  tonnage: number;
  cost: number;
  hullPoints: number;
  power: number;
  powerRequired: {
    basicSystems: number;
    manoeuvre: number;
    jump: number;
  };
  techLevel: number;
}

interface FuelRequirements {
  reactionDrive: number;  // tons
  jumpDrive: number;      // tons
  powerPlant: number;     // tons
  total: number;          // tons
}

interface HullOption {
  cost: number;
  techLevel: number;
  description: string;
}

interface StealthOption extends HullOption {
  types: {
    [key: string]: {
      cost: number;
      techLevel: number;
      dm: number;
      tonnage: number;
    };
  };
}

// Add after other interfaces
interface Hardpoint {
  id: string;
  type: 'Fixed Mount' | 'Turret' | 'Barbette' | 'Small Bay' | 'Medium Bay' | 'Large Bay' | 'Spinal Mount' | 'Point Defense' | 'Screen' | 'Black Globe';
  weapon?: string;
  isFirmpoint?: boolean;
  isUpgradedToTurret?: boolean;
  ammo?: {
    tons: number;
    rounds: number;
  };
}

// Hull configuration details
const hullConfigurations = {
  'Standard': {
    streamlined: 'Partial',
    volumeModifier: 0,
    hullPointsModifier: 0,
    costModifier: 0,
    description: 'Boxy, cylindrical, series of joined boxes, possibly with rounded edges. Examples: yacht, subsidised liner.'
  },
  'Streamlined': {
    streamlined: 'Yes',
    volumeModifier: 0.2,
    hullPointsModifier: 0,
    costModifier: 0.2,
    description: 'Needle, wedge, disc, lifting body, lozenge, boxy with rounded nose. Examples: pinnace, shuttle, scout/courier, free trader.'
  },
  'Sphere': {
    streamlined: 'Partial',
    volumeModifier: -0.1,
    hullPointsModifier: 0,
    costModifier: 0.1,
    description: 'Sphere or large spheroid with limited protuberances. Examples: express boat, mercenary cruiser.'
  },
  'Close Structure': {
    streamlined: 'Partial',
    volumeModifier: 0.5,
    hullPointsModifier: 0,
    costModifier: -0.2,
    description: 'Boxes joined by sturdy struts or with multiple projecting elements. Examples: Chrysanthemum-class destroyer escort, Gazelle-class close escort.'
  },
  'Dispersed Structure': {
    streamlined: 'No',
    volumeModifier: 1.0,
    hullPointsModifier: -0.1,
    costModifier: -0.5,
    description: 'Irregular joined shapes, open framework, rings. Examples: Donosev-class survey scout, Lab Ship, Arakoine-class strike cruiser.'
  },
  'Planetoid': {
    streamlined: 'No',
    volumeModifier: 0,
    hullPointsModifier: 0.25,
    costModifier: 0,
    description: 'Generally lumpy, rounded potato shapes. Example: Planetoid Monitor.'
  },
  'Buffered Planetoid': {
    streamlined: 'No',
    volumeModifier: 0,
    hullPointsModifier: 0.5,
    costModifier: 0,
    description: 'Generally lumpy, rounded potato shapes with additional buffering. Example: Planetoid Monitor.'
  }
};

// Specialized hull types
const specializedHullTypes = {
  'Reinforced': {
    costModifier: 0.5,
    hullPointsModifier: 0.1,
    description: 'Increases hull points by 10% at 50% additional cost.'
  },
  'Light': {
    costModifier: -0.25,
    hullPointsModifier: -0.1,
    description: 'Decreases hull points by 10% at 25% reduced cost.'
  },
  'Military': {
    costModifier: 0.25,
    hullPointsModifier: 0,
    description: 'Allows double standard armour rating. Only for ships > 5,000 tons.'
  },
  'Non-Gravity': {
    costModifier: -0.5,
    hullPointsModifier: 0,
    description: 'No artificial gravity, reduces power requirements by 50%. Maximum size 500,000 tons.'
  }
};

// Additional hull types
const additionalHullTypes = {
  'Double Hull': {
    costModifier: 0.01, // per percent of spun hull
    description: 'Two-hulled cylinder with spinning outer hull for gravity. Minimum 60 tons outer hull.'
  },
  'Hamster Cage': {
    costModifier: 0.02, // per percent of spun ring
    description: 'Spinning rings for gravity. Minimum 15m radius per ring.'
  },
  'Breakaway Hulls': {
    costModifier: 2, // MCr per ton
    description: 'Ship can split into multiple independent vessels. Each section needs bridge and power plant.'
  }
};

// Hull options
const hullOptions: { [key: string]: HullOption | StealthOption } = {
  'Heat Shielding': {
    cost: 0.1, // MCr per ton
    techLevel: 6,
    description: 'Protects against re-entry heat and star proximity.'
  },
  'Radiation Shielding': {
    cost: 0.025, // MCr per ton
    techLevel: 7,
    description: 'Improves crew protection against radiation.'
  },
  'Reflec': {
    cost: 0.1, // MCr per ton
    techLevel: 10,
    description: '+3 Protection against lasers. Cannot combine with Stealth.'
  },
  'Solar Coating': {
    cost: 0, // See Solar Energy Systems
    techLevel: 0,
    description: 'Provides backup power and flexibility. Cannot combine with other options except radiation shielding.'
  },
  'Stealth': {
    cost: 0.04, // Base cost for Basic
    techLevel: 8,
    description: 'Reduces detection chance. Cannot combine with Reflec.',
    types: {
      'Basic': { cost: 0.04, techLevel: 8, dm: -2, tonnage: 0.02 },
      'Improved': { cost: 0.1, techLevel: 10, dm: -2, tonnage: 0 },
      'Enhanced': { cost: 0.5, techLevel: 12, dm: -4, tonnage: 0 },
      'Advanced': { cost: 1.0, techLevel: 14, dm: -6, tonnage: 0 }
    }
  }
};

// Armour types
const armourTypes = {
  'Titanium Steel': {
    techLevel: 7,
    tonnageConsumed: 0.025,
    costPerTon: 0.05, // MCr
    maxProtection: (tl: number) => Math.min(tl, 9)
  },
  'Crystaliron': {
    techLevel: 10,
    tonnageConsumed: 0.0125,
    costPerTon: 0.2, // MCr
    maxProtection: (tl: number) => Math.min(tl, 13)
  },
  'Bonded Superdense': {
    techLevel: 14,
    tonnageConsumed: 0.008,
    costPerTon: 0.5, // MCr
    maxProtection: (tl: number) => tl
  },
  'Molecular Bonded': {
    techLevel: 16,
    tonnageConsumed: 0.005,
    costPerTon: 1.5, // MCr
    maxProtection: (tl: number) => tl + 4
  }
};

// Armour tonnage multipliers based on hull size
const getArmourMultiplier = (size: number): number => {
  if (size <= 15) return 4;
  if (size <= 25) return 3;
  if (size <= 99) return 2;
  return 1;
};

// Calculate hull points based on size
const calculateHullPoints = (size: number): number => {
  if (size >= 100000) return Math.floor(size / 1.5);
  if (size >= 25000) return Math.floor(size / 2);
  return Math.floor(size / 2.5);
};

// Sample data for hulls, drives, and power plants
const hulls: Hull[] = [
  { 
    type: 'Streamlined', 
    size: 100, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 10, 
    hullPoints: 40,
    minTechLevel: 7
  },
  { 
    type: 'Streamlined', 
    size: 200, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 20, 
    hullPoints: 80,
    minTechLevel: 7
  },
  { 
    type: 'Standard', 
    size: 200, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 20, 
    hullPoints: 80,
    minTechLevel: 7
  },
  { 
    type: 'Standard', 
    size: 400, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 40, 
    hullPoints: 160,
    minTechLevel: 7
  },
  { 
    type: 'Close Structure', 
    size: 300, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 30, 
    hullPoints: 120,
    minTechLevel: 8
  },
  { 
    type: 'Dispersed Structure', 
    size: 500, 
    specializedType: undefined,
    additionalType: undefined,
    options: {
      heatShielding: false,
      radiationShielding: false,
      reflec: false,
      solarCoating: false,
      stealth: undefined
    },
    armour: {
      type: 'Titanium Steel',
      protection: 0
    },
    cost: 50, 
    hullPoints: 200,
    minTechLevel: 8
  }
];

const drives: Drive[] = [
  // Manoeuvre Drives (TL9+)
  { 
    type: 'Manoeuvre', 
    rating: 0, 
    percentOfHull: 0.5, 
    minTechLevel: 9, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 1, 
    percentOfHull: 1, 
    minTechLevel: 9, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 2, 
    percentOfHull: 2, 
    minTechLevel: 10, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 3, 
    percentOfHull: 3, 
    minTechLevel: 10, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 4, 
    percentOfHull: 4, 
    minTechLevel: 11, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 5, 
    percentOfHull: 5, 
    minTechLevel: 11, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 6, 
    percentOfHull: 6, 
    minTechLevel: 12, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 7, 
    percentOfHull: 7, 
    minTechLevel: 13, 
    costPerTon: 2,
    requiresPower: true
  },
  { 
    type: 'Manoeuvre', 
    rating: 8, 
    percentOfHull: 8, 
    minTechLevel: 14, 
    costPerTon: 2,
    requiresPower: true
  },

  // Jump Drives (TL9+)
  { 
    type: 'Jump', 
    rating: 1, 
    percentOfHull: 2.5, 
    minTechLevel: 9, 
    costPerTon: 1.5,
    requiresPower: true
  },
  { 
    type: 'Jump', 
    rating: 2, 
    percentOfHull: 5, 
    minTechLevel: 11, 
    costPerTon: 1.5,
    requiresPower: true
  },
  { 
    type: 'Jump', 
    rating: 3, 
    percentOfHull: 7.5, 
    minTechLevel: 12, 
    costPerTon: 1.5,
    requiresPower: true
  },
  { 
    type: 'Jump', 
    rating: 4, 
    percentOfHull: 10, 
    minTechLevel: 13, 
    costPerTon: 1.5,
    requiresPower: true
  },
  { 
    type: 'Jump', 
    rating: 5, 
    percentOfHull: 12.5, 
    minTechLevel: 14, 
    costPerTon: 1.5,
    requiresPower: true
  },
  { 
    type: 'Jump', 
    rating: 6, 
    percentOfHull: 15, 
    minTechLevel: 15, 
    costPerTon: 1.5,
    requiresPower: true
  },

  // Reaction Drives (TL7+)
  { 
    type: 'Reaction', 
    rating: 0, 
    percentOfHull: 1, 
    minTechLevel: 7, 
    costPerTon: 0.2,
    requiresPower: false
  },
  { 
    type: 'Reaction', 
    rating: 1, 
    percentOfHull: 2, 
    minTechLevel: 7, 
    costPerTon: 0.2,
    requiresPower: false
  },
  { 
    type: 'Reaction', 
    rating: 2, 
    percentOfHull: 4, 
    minTechLevel: 7, 
    costPerTon: 0.2,
    requiresPower: false
  },
  { 
    type: 'Reaction', 
    rating: 3, 
    percentOfHull: 6, 
    minTechLevel: 7, 
    costPerTon: 0.2,
    requiresPower: false
  },
  { 
    type: 'Reaction', 
    rating: 4, 
    percentOfHull: 8, 
    minTechLevel: 8, 
    costPerTon: 0.2,
    requiresPower: false
  },
  { 
    type: 'Reaction', 
    rating: 5, 
    percentOfHull: 10, 
    minTechLevel: 8, 
    costPerTon: 0.2,
    requiresPower: false
  }
];

const powerPlants: PowerPlant[] = [
  { 
    type: 'Fission', 
    techLevel: 6, 
    powerPerTon: 8, 
    costPerTon: 0.4,
    canPowerJump: false
  },
  { 
    type: 'Chemical', 
    techLevel: 7, 
    powerPerTon: 5, 
    costPerTon: 0.25,
    canPowerJump: false
  },
  { 
    type: 'Fusion', 
    techLevel: 8, 
    powerPerTon: 10, 
    costPerTon: 0.5,
    canPowerJump: true
  },
  { 
    type: 'Fusion', 
    techLevel: 12, 
    powerPerTon: 15, 
    costPerTon: 1,
    canPowerJump: true
  },
  { 
    type: 'Fusion', 
    techLevel: 15, 
    powerPerTon: 20, 
    costPerTon: 2,
    canPowerJump: true
  },
  { 
    type: 'Antimatter', 
    techLevel: 20, 
    powerPerTon: 100, 
    costPerTon: 10,
    canPowerJump: true
  }
];

// Add descriptions for hulls and power plants
const hullDescriptions = {
  'Streamlined': 'Streamlined hulls are designed for atmospheric operations. They are more expensive but can land on planets with atmospheres.',
  'Unstreamlined': 'Unstreamlined hulls are cheaper but cannot enter atmospheres. They are typically used for space-only operations.',
  'Distributed': 'Distributed hulls are used for very large ships. They are more expensive but provide better structural integrity for massive vessels.'
};

const powerPlantDescriptions = {
  'Fission': 'Basic power plant technology. Cannot power jump drives.',
  'Chemical': 'Simple and cheap, but inefficient. Cannot power jump drives.',
  'Fusion': 'Standard power plant technology. Can power jump drives. Higher tech levels provide more power per ton.',
  'Antimatter': 'Most advanced power plant. Extremely powerful but very expensive. Can power jump drives.'
};

// Update the validateHullOptions function
const validateHullOptions = (options: Hull['options']): string[] => {
  const errors: string[] = [];

  // Check Reflec + Stealth incompatibility
  if (options.reflec && options.stealth) {
    errors.push('Reflec cannot be combined with Stealth');
  }

  // Check Solar Coating incompatibility
  if (options.solarCoating) {
    if (options.reflec) {
      errors.push('Solar Coating cannot be combined with Reflec');
    }
    if (options.stealth) {
      errors.push('Solar Coating cannot be combined with Stealth');
    }
  }

  return errors;
};

const calculateHullCost = (size: number, config: string, specialized?: string, additional?: string, options?: Hull['options']): number => {
  let cost = size * 0.05; // Base cost: Cr50,000 per ton = MCr0.05 per ton
  
  // Apply configuration modifier
  const configMod = hullConfigurations[config as keyof typeof hullConfigurations];
  if (typeof configMod.costModifier === 'number') {
    cost *= (1 + configMod.costModifier);
  } else if (configMod.costModifier === 'Special') {
    // Planetoid hulls cost Cr4,000 per ton
    cost = size * 0.004;
  }
  
  // Apply specialized type modifier if applicable
  if (specialized) {
    const specMod = specializedHullTypes[specialized as keyof typeof specializedHullTypes];
    cost *= (1 + specMod.costModifier);
  }
  
  // Apply additional type modifier if applicable
  if (additional) {
    const addMod = additionalHullTypes[additional as keyof typeof additionalHullTypes];
    if (additional === 'Breakaway Hulls') {
      cost += size * addMod.costModifier;
    } else {
      // For Double Hull and Hamster Cage, cost is per percent of spun section
      // This would need to be calculated based on user input
      cost *= (1 + addMod.costModifier);
    }
  }

  // Add cost of hull options
  if (options) {
    if (options.heatShielding) {
      cost += size * 0.1; // MCr0.1 per ton
    }
    if (options.radiationShielding) {
      cost += size * 0.025; // MCr0.025 per ton
    }
    if (options.reflec) {
      cost += size * 0.1; // MCr0.1 per ton
    }
    if (options.stealth) {
      const stealthType = options.stealth.type;
      const stealthDetails = (hullOptions['Stealth'] as StealthOption).types[stealthType];
      cost += size * stealthDetails.cost;
    }
  }
  
  return cost;
};

// Bridge size table
const getStandardBridgeSize = (tons: number): number => {
  if (tons <= 50) return 3;
  if (tons <= 99) return 6;
  if (tons <= 200) return 10;
  if (tons <= 1000) return 20;
  if (tons <= 2000) return 40;
  if (tons <= 100000) return 60;
  // 100,001+ tons: +20 tons per additional 100,000 tons
  return 60 + 20 * Math.ceil((tons - 100000) / 100000);
};

// Bridge cost calculation
const getBridgeCost = (tons: number): number => {
  return 0.5 * Math.ceil(tons / 100) / 1; // MCr0.5 per 100 tons (or part of)
};

// Computer data (keep outside)
const computerOptions = [
  { name: 'Computer/5', processing: 5, tl: 7, cost: 0.03 },
  { name: 'Computer/10', processing: 10, tl: 9, cost: 0.16 },
  { name: 'Computer/15', processing: 15, tl: 11, cost: 2 },
  { name: 'Computer/20', processing: 20, tl: 12, cost: 5 },
  { name: 'Computer/25', processing: 25, tl: 13, cost: 10 },
  { name: 'Computer/30', processing: 30, tl: 14, cost: 20 },
  { name: 'Computer/35', processing: 35, tl: 15, cost: 30 },
  // Cores
  { name: 'Core/40', processing: 40, tl: 9, cost: 45 },
  { name: 'Core/50', processing: 50, tl: 10, cost: 60 },
  { name: 'Core/60', processing: 60, tl: 11, cost: 75 },
  { name: 'Core/70', processing: 70, tl: 12, cost: 80 },
  { name: 'Core/80', processing: 80, tl: 13, cost: 95 },
  { name: 'Core/90', processing: 90, tl: 14, cost: 120 },
  { name: 'Core/100', processing: 100, tl: 15, cost: 130 },
];

// Sensor options data (keep outside)
const sensorOptions = [
  { name: 'Basic', tl: 8, suite: 'Lidar, Radar', dm: -4, power: 0, tons: 0, cost: 0 },
  { name: 'Civilian Grade', tl: 9, suite: 'Lidar, Radar', dm: -2, power: 1, tons: 1, cost: 3 },
  { name: 'Military Grade', tl: 10, suite: 'Jammers, Lidar, Radar', dm: 0, power: 2, tons: 2, cost: 4.1 },
  { name: 'Improved', tl: 12, suite: 'Densitometer, Jammers, Lidar, Radar', dm: 1, power: 4, tons: 3, cost: 4.3 },
  { name: 'Advanced', tl: 15, suite: 'Densitometer, Jammers, Lidar, Neural Activity Sensor, Radar', dm: 2, power: 6, tons: 5, cost: 5.3 },
];

// Add weapon data structures above App
const turretWeapons = [
  { name: 'Beam Laser', tl: 10, range: 'Medium', power: 4, damage: '1D', cost: 0.5, traits: '' },
  { name: 'Fusion Gun', tl: 14, range: 'Medium', power: 12, damage: '4D', cost: 2, traits: 'Radiation' },
  { name: 'Laser Drill', tl: 8, range: 'Adjacent', power: 4, damage: '2D', cost: 0.15, traits: 'AP 4' },
  { name: 'Missile Rack', tl: 7, range: 'Special', power: 0, damage: '4D', cost: 0.75, traits: 'Smart' },
  { name: 'Particle Beam', tl: 12, range: 'Very Long', power: 8, damage: '3D', cost: 4, traits: 'Radiation' },
  { name: 'Plasma Gun', tl: 11, range: 'Medium', power: 6, damage: '3D', cost: 2.5, traits: '' },
  { name: 'Pulse Laser', tl: 9, range: 'Long', power: 4, damage: '2D', cost: 1, traits: '' },
  { name: 'Railgun', tl: 10, range: 'Short', power: 2, damage: '2D', cost: 1, traits: 'AP 4' },
  { name: 'Sandcaster', tl: 9, range: 'Special', power: 0, damage: 'Special', cost: 0.25, traits: '' },
];
const barbetteWeapons = [
  { name: 'Beam Laser Barbette', tl: 10, range: 'Medium', power: 12, damage: '2D', cost: 3, traits: '' },
  { name: 'Fusion Barbette', tl: 12, range: 'Medium', power: 20, damage: '5D', cost: 4, traits: 'AP 3, Radiation' },
  { name: 'Ion Cannon', tl: 12, range: 'Medium', power: 10, damage: '7D', cost: 6, traits: 'Ion' },
  { name: 'Missile Barbette', tl: 7, range: 'Special', power: 0, damage: '4D', cost: 4, traits: 'Smart' },
  { name: 'Particle Barbette', tl: 11, range: 'Very Long', power: 15, damage: '4D', cost: 8, traits: 'Radiation' },
  { name: 'Plasma Barbette', tl: 11, range: 'Medium', power: 12, damage: '4D', cost: 5, traits: 'AP 2' },
  { name: 'Pulse Laser Barbette', tl: 9, range: 'Long', power: 12, damage: '3D', cost: 6, traits: '' },
  { name: 'Railgun Barbette', tl: 10, range: 'Medium', power: 5, damage: '3D', cost: 2, traits: 'AP 5' },
  { name: 'Torpedo', tl: 7, range: 'Special', power: 2, damage: '6D', cost: 3, traits: 'Smart' },
];

// Add weapon mode options for turrets
const turretModes = [
  { label: 'Single', value: 'single', tl: 7, tons: 1, power: 1, cost: 0.2 },
  { label: 'Double', value: 'double', tl: 8, tons: 1, power: 1, cost: 0.5 },
  { label: 'Triple', value: 'triple', tl: 9, tons: 1, power: 1, cost: 1 },
];

// Define WeaponSelection type
interface WeaponSelection {
  type: string;
  tonnage?: number;
  multiple?: number;
}

// Helper functions for weapon/mount tonnage and cost
function getMountStats(type: string, popUp: boolean, isFirmpoint: boolean) {
  if (type === 'Fixed Mount') return { tons: 0 + (popUp ? 1 : 0), cost: 0.1 + (popUp ? 1 : 0) };
  if (type === 'Turret') return { tons: 1 + (popUp ? 1 : 0), cost: 0.2 + (popUp ? 1 : 0) };
  if (type === 'Barbette') return { tons: isFirmpoint ? 7 : 5, cost: 4 };
  if (type === 'Small Bay') return { tons: 50, cost: 0 };
  if (type === 'Medium Bay') return { tons: 100, cost: 0 };
  if (type === 'Large Bay') return { tons: 500, cost: 0 };
  return { tons: 0, cost: 0 };
}

function getWeaponStats(type: string, mountType?: string) {
  let w = turretWeapons.find(w => w.name === type) || barbetteWeapons.find(w => w.name === type);
  if (!w && mountType === 'Small Bay') w = smallBayWeapons.find(w => w.name === type);
  if (!w && mountType === 'Medium Bay') w = mediumBayWeapons.find(w => w.name === type);
  if (!w && mountType === 'Large Bay') w = largeBayWeapons.find(w => w.name === type);
  if (!w) return { tons: 0, cost: 0 };
  return { tons: 0, cost: w.cost };
}

// Add bay weapon data
const smallBayWeapons: Array<{ name: string; tl: number; range: string; power: number; damage: string; cost: number; traits: string; tons: number; }> = [
  { name: 'Fusion Gun Bay', tl: 12, range: 'Medium', power: 50, damage: '6D', cost: 8, traits: 'AP 6, Radiation', tons: 50 },
  { name: 'Ion Cannon Bay', tl: 12, range: 'Medium', power: 20, damage: '6D', cost: 15, traits: 'Ion', tons: 50 },
  { name: 'Mass Driver Bay', tl: 8, range: 'Short', power: 15, damage: '3D', cost: 40, traits: 'Orbital Bombardment', tons: 50 },
  { name: 'Meson Gun Bay', tl: 11, range: 'Long', power: 20, damage: '5D', cost: 50, traits: 'AP ∞, Radiation', tons: 50 },
  { name: 'Missile Bay', tl: 7, range: 'Special', power: 5, damage: '4D', cost: 12, traits: 'Smart', tons: 50 },
  { name: 'Orbital Strike Mass Driver Bay', tl: 10, range: 'Short', power: 35, damage: '7D', cost: 25, traits: 'Orbital Strike', tons: 50 },
  { name: 'Orbital Strike Missile Bay', tl: 10, range: 'Medium', power: 5, damage: '3D', cost: 16, traits: 'Orbital Strike', tons: 50 },
  { name: 'Particle Beam Bay', tl: 11, range: 'Very Long', power: 30, damage: '6D', cost: 20, traits: 'Radiation', tons: 50 },
  { name: 'Railgun Bay', tl: 10, range: 'Short', power: 10, damage: '3D', cost: 30, traits: 'AP 10', tons: 50 },
  { name: 'Repulsor Bay', tl: 15, range: 'Short', power: 50, damage: 'Special', cost: 30, traits: '', tons: 50 },
  { name: 'Torpedo Bay', tl: 7, range: 'Special', power: 2, damage: '6D', cost: 3, traits: 'Smart', tons: 50 },
];
const mediumBayWeapons: Array<{ name: string; tl: number; range: string; power: number; damage: string; cost: number; traits: string; tons: number; }> = [
  { name: 'Fusion Gun Bay', tl: 12, range: 'Medium', power: 80, damage: '7D', cost: 14, traits: 'AP 6, Radiation', tons: 100 },
  { name: 'Ion Cannon Bay', tl: 12, range: 'Medium', power: 30, damage: '8D', cost: 25, traits: 'Ion', tons: 100 },
  { name: 'Mass Driver Bay', tl: 8, range: 'Short', power: 25, damage: '4D', cost: 60, traits: 'Orbital Bombardment', tons: 100 },
  { name: 'Meson Gun Bay', tl: 12, range: 'Long', power: 30, damage: '6D', cost: 60, traits: 'AP ∞, Radiation', tons: 100 },
  { name: 'Missile Bay', tl: 7, range: 'Special', power: 10, damage: '4D', cost: 20, traits: 'Smart', tons: 100 },
  { name: 'Orbital Strike Mass Driver Bay', tl: 10, range: 'Short', power: 50, damage: '10D', cost: 35, traits: 'Orbital Strike', tons: 100 },
  { name: 'Orbital Strike Missile Bay', tl: 10, range: 'Medium', power: 15, damage: '5D', cost: 20, traits: 'Orbital Strike', tons: 100 },
  { name: 'Particle Beam Bay', tl: 12, range: 'Very Long', power: 50, damage: '8D', cost: 40, traits: 'Radiation', tons: 100 },
  { name: 'Railgun Bay', tl: 10, range: 'Short', power: 15, damage: '5D', cost: 50, traits: 'AP 10', tons: 100 },
  { name: 'Repulsor Bay', tl: 14, range: 'Short', power: 100, damage: 'Special', cost: 60, traits: '', tons: 100 },
  { name: 'Torpedo Bay', tl: 7, range: 'Special', power: 5, damage: '6D', cost: 6, traits: 'Smart', tons: 100 },
];
const largeBayWeapons: Array<{ name: string; tl: number; range: string; power: number; damage: string; cost: number; traits: string; tons: number; }> = [
  { name: 'Fusion Gun Bay', tl: 12, range: 'Long', power: 100, damage: '10D', cost: 25, traits: 'AP 8, Radiation', tons: 500 },
  { name: 'Ion Cannon Bay', tl: 12, range: 'Long', power: 40, damage: '10D', cost: 40, traits: 'Ion', tons: 500 },
  { name: 'Mass Driver Bay', tl: 8, range: 'Medium', power: 35, damage: '6D', cost: 80, traits: 'Orbital Bombardment', tons: 500 },
  { name: 'Meson Gun Bay', tl: 13, range: 'Long', power: 120, damage: '6D', cost: 250, traits: 'AP ∞, Radiation', tons: 500 },
  { name: 'Missile Bay', tl: 7, range: 'Special', power: 20, damage: '4D', cost: 25, traits: 'Smart', tons: 500 },
  { name: 'Orbital Strike Mass Driver Bay', tl: 10, range: 'Short', power: 75, damage: '12D', cost: 50, traits: 'Orbital Strike', tons: 500 },
  { name: 'Orbital Strike Missile Bay', tl: 10, range: 'Medium', power: 25, damage: '8D', cost: 24, traits: 'Orbital Strike', tons: 500 },
  { name: 'Particle Beam Bay', tl: 13, range: 'Distant', power: 80, damage: '10D', cost: 60, traits: 'Radiation', tons: 500 },
  { name: 'Railgun Bay', tl: 10, range: 'Medium', power: 25, damage: '6D', cost: 70, traits: 'AP 10', tons: 500 },
  { name: 'Repulsor Bay', tl: 13, range: 'Short', power: 200, damage: 'Special', cost: 90, traits: '', tons: 500 },
  { name: 'Torpedo Bay', tl: 7, range: 'Special', power: 10, damage: '6D', cost: 10, traits: 'Smart', tons: 500 },
];

// Spinal mount weapons data
const spinalMountWeapons = [
  { 
    name: 'Mass Driver Spinal Mount', 
    tl: 10, 
    range: 'Short', 
    baseSize: 5000, 
    power: 250, 
    damage: '4D', 
    cost: 1500, 
    maxSize: 100000, 
    traits: 'AP 15, Orbital Bombardment' 
  },
  { 
    name: 'Meson Spinal Mount', 
    tl: 12, 
    range: 'Long', 
    baseSize: 7500, 
    power: 1000, 
    damage: '6D', 
    cost: 2000, 
    maxSize: 75000, 
    traits: 'AP ∞, Radiation' 
  },
  { 
    name: 'Particle Spinal Mount', 
    tl: 11, 
    range: 'Very Long', 
    baseSize: 3500, 
    power: 1000, 
    damage: '8D', 
    cost: 1000, 
    maxSize: 28000, 
    traits: 'Radiation' 
  },
  { 
    name: 'Railgun Spinal Mount', 
    tl: 10, 
    range: 'Medium', 
    baseSize: 3500, 
    power: 500, 
    damage: '4D', 
    cost: 500, 
    maxSize: 21000, 
    traits: 'AP 20' 
  }
];

// Point-defense weapons data
const pointDefenseWeapons = [
  {
    name: 'Point Defense Laser',
    tl: 7,
    intercept: 4,
    power: 1,
    tons: 1,
    cost: 0.5
  },
  {
    name: 'Point Defense Gauss Gun',
    tl: 8,
    intercept: 5,
    power: 1,
    tons: 1,
    cost: 0.5,
    ammo: {
      rounds: 100,
      cost: 0.1
    }
  },
  {
    name: 'Point Defense Particle Beam',
    tl: 9,
    intercept: 6,
    power: 2,
    tons: 1,
    cost: 1
  }
];

// Screen data
const screens = [
  {
    name: 'Meson Screen',
    tl: 9,
    power: 10,
    tons: 1,
    cost: 2,
    effect: 'Reduces meson gun damage by 1D'
  },
  {
    name: 'Nuclear Damper',
    tl: 10,
    power: 10,
    tons: 1,
    cost: 2,
    effect: 'Reduces nuclear missile damage by 1D'
  }
];

// Black Globe Generator data
const blackGlobeGenerator = {
  name: 'Black Globe Generator',
  tl: 15,
  power: 20,
  tons: 1,
  cost: 5,
  flickerRates: [
    { rate: 1, attacks: 1, thrust: 1, sensor: 1 },
    { rate: 2, attacks: 2, thrust: 2, sensor: 2 },
    { rate: 3, attacks: 3, thrust: 3, sensor: 3 },
    { rate: 4, attacks: 4, thrust: 4, sensor: 4 },
    { rate: 5, attacks: 5, thrust: 5, sensor: 5 }
  ]
};

function App() {
  const [step, setStep] = useState(0);
  const [shipSize, setShipSize] = useState<number>(100);
  const [selectedHull, setSelectedHull] = useState<Hull | null>(null);
  const [selectedDrives, setSelectedDrives] = useState<Drive[]>([]);
  const [selectedPowerPlant, setSelectedPowerPlant] = useState<PowerPlant | null>(null);
  const [techLevel, setTechLevel] = useState<number>(7);
  const [errors, setErrors] = useState<string[]>([]);
  const [reactionDriveHours, setReactionDriveHours] = useState<number>(1);
  const [powerPlantWeeks, setPowerPlantWeeks] = useState<number>(4);
  const [powerPlantTons, setPowerPlantTons] = useState<number | null>(null);
  const [userSetPowerPlantTons, setUserSetPowerPlantTons] = useState<boolean>(false);
  // Add bridge step state
  const [bridgeType, setBridgeType] = useState<'standard' | 'smaller' | 'command' | 'cockpit' | 'dualCockpit'>('standard');
  const [bridgeSize, setBridgeSize] = useState<number>(10);
  const [bridgeCost, setBridgeCost] = useState<number>(0.05 * shipSize); // MCr0.5 per 100 tons
  const [bridgeDM, setBridgeDM] = useState<string>('');
  // Add state for dedicated jump fuel storage
  const [additionalFuel, setAdditionalFuel] = useState<number>(0);
  // Add state for fine adjustment toggle
  const [fineAdjustment, setFineAdjustment] = useState<boolean>(false);

  // Group drives by type for dropdowns
  const manoeuvreDrives = drives.filter(d => d.type === 'Manoeuvre');
  const jumpDrives = drives.filter(d => d.type === 'Jump');
  const reactionDrives = drives.filter(d => d.type === 'Reaction');

  // Sensor step state (move inside App)
  const [selectedSensor, setSelectedSensor] = useState('Basic');

  // Add new state for hardpoints
  const [hardpoints, setHardpoints] = useState<Hardpoint[]>([]);
  const [upgradedFirmpoint, setUpgradedFirmpoint] = useState<number | null>(null);

  // FIX: Move weaponSelections state here
  const [weaponSelections, setWeaponSelections] = useState<{[id: string]: { mountType: string; weapons: WeaponSelection[]; popUp: boolean; } }>({});

  const calculateShipStats = (): ShipStats => {
    if (!selectedHull) return {
      tonnage: shipSize,
      cost: 0,
      hullPoints: 0,
      power: 0,
      powerRequired: {
        basicSystems: 0,
        manoeuvre: 0,
        jump: 0
      },
      techLevel
    };

    // Calculate power requirements
    const basicSystemsPower = shipSize * 0.2; // 20% of hull tonnage
    const manoeuvreDrive = selectedDrives.find(d => d.type === 'Manoeuvre');
    const manoeuvrePower = manoeuvreDrive ? 
      (manoeuvreDrive.rating === 0 ? 0.25 : manoeuvreDrive.rating) * shipSize * 0.1 : 0;
    const jumpDrive = selectedDrives.find(d => d.type === 'Jump');
    const jumpPower = jumpDrive ? jumpDrive.rating * shipSize * 0.1 : 0;

    // Calculate total power available
    const power = selectedPowerPlant ? selectedPowerPlant.powerPerTon * shipSize : 0;

    // Calculate costs
    const hullCost = selectedHull.cost;
    const drivesCost = selectedDrives.reduce((sum, drive) => {
      const driveTonnage = drive.type === 'Jump' ? 
        (shipSize * drive.percentOfHull / 100) + 5 : // Jump drives add 5 tons
        shipSize * drive.percentOfHull / 100;
      return sum + (driveTonnage * drive.costPerTon);
    }, 0);
    const powerPlantCost = selectedPowerPlant ? 
      shipSize * selectedPowerPlant.costPerTon : 0;

    // Calculate weapons cost
    const weaponsCost = hardpoints.reduce((sum, hp) => {
      const sel = weaponSelections[hp.id];
      if (!sel || !sel.weapons.some(w => w.type)) return sum;
      return sum + sel.weapons.reduce((weaponSum, w) => {
        let weapon = turretWeapons.find(x => x.name === w.type) || 
                    barbetteWeapons.find(x => x.name === w.type) ||
                    spinalMountWeapons.find(x => x.name === w.type);
        if (!weapon && hp.type === 'Small Bay') weapon = smallBayWeapons.find(x => x.name === w.type);
        if (!weapon && hp.type === 'Medium Bay') weapon = mediumBayWeapons.find(x => x.name === w.type);
        if (!weapon && hp.type === 'Large Bay') weapon = largeBayWeapons.find(x => x.name === w.type);
        if (!weapon) return weaponSum;
        let cost = weapon.cost;
        if (hp.type === 'Spinal Mount' && w.multiple) {
          cost *= w.multiple;
        }
        return weaponSum + cost;
      }, 0);
    }, 0);

    return {
      tonnage: shipSize,
      cost: hullCost + drivesCost + powerPlantCost + weaponsCost,
      hullPoints: selectedHull.hullPoints,
      power,
      powerRequired: {
        basicSystems: basicSystemsPower,
        manoeuvre: manoeuvrePower,
        jump: jumpPower
      },
      techLevel
    };
  };

  const validateSelections = () => {
    const newErrors: string[] = [];

    // Validate ship size
    if (shipSize < 100) {
      newErrors.push('Ship size must be at least 100 tons');
    }
    if (shipSize > 1000000) {
      newErrors.push('Ship size cannot exceed 1,000,000 tons');
    }

    // Validate tech level requirements
    if (selectedHull && selectedHull.minTechLevel > techLevel) {
      newErrors.push(`Hull requires Tech Level ${selectedHull.minTechLevel}`);
    }

    selectedDrives.forEach(drive => {
      if (drive.minTechLevel > techLevel) {
        newErrors.push(`${drive.type} Drive requires Tech Level ${drive.minTechLevel}`);
      }
    });

    if (selectedPowerPlant && selectedPowerPlant.techLevel > techLevel) {
      newErrors.push(`Power Plant requires Tech Level ${selectedPowerPlant.techLevel}`);
    }

    // Validate jump drive power requirements
    const jumpDrive = selectedDrives.find(d => d.type === 'Jump');
    if (jumpDrive && selectedPowerPlant && !selectedPowerPlant.canPowerJump) {
      newErrors.push('Jump Drive requires Fusion or Antimatter Power Plant');
    }

    // Validate minimum jump drive tonnage
    if (jumpDrive) {
      const jumpTonnage = (selectedHull?.size || 0) * jumpDrive.percentOfHull / 100 + 5;
      if (jumpTonnage < 10) {
        newErrors.push('Jump Drive requires minimum 10 tons');
      }
    }

    setErrors(newErrors);
  };

  useEffect(() => {
    validateSelections();
  }, [shipSize, selectedHull, selectedDrives, selectedPowerPlant, techLevel]);

  const stats = calculateShipStats();

  const calculateFuelRequirements = (): FuelRequirements => {
    if (!selectedHull) return {
      reactionDrive: 0,
      jumpDrive: 0,
      powerPlant: 0,
      total: 0
    };

    const tonnage = selectedHull.size;
    let reactionFuel = 0;
    let jumpFuel = 0;
    let powerPlantFuel = 0;

    // Calculate reaction drive fuel
    const reactionDrive = selectedDrives.find(d => d.type === 'Reaction');
    if (reactionDrive) {
      const thrust = reactionDrive.rating;
      const fuelPercentage = thrust * 2.5 * reactionDriveHours;
      reactionFuel = (tonnage * fuelPercentage) / 100;
    }

    // Calculate jump drive fuel
    const jumpDrive = selectedDrives.find(d => d.type === 'Jump');
    if (jumpDrive) {
      const minJumpFuel = (tonnage * 10 * jumpDrive.rating) / 100;
      jumpFuel = minJumpFuel;
      // total fuel is now minJumpFuel + additionalFuel
    }

    // Calculate power plant fuel
    if (selectedPowerPlant) {
      const powerPlantTonnage = tonnage; // Power plant is same size as ship
      if (selectedPowerPlant.type === 'Chemical') {
        // Chemical plants need 10 tons per ton of power plant per 2 weeks
        powerPlantFuel = (powerPlantTonnage * 10 * powerPlantWeeks) / 2;
      } else {
        // Other plants need 10% of their size per month
        powerPlantFuel = Math.ceil(powerPlantTonnage * 0.1 * powerPlantWeeks / 4);
      }
    }

    // total fuel is minJumpFuel + additionalFuel (if jump drive), else just sum
    let totalFuel = reactionFuel + powerPlantFuel;
    if (jumpDrive) {
      const minJumpFuel = (tonnage * 10 * jumpDrive.rating) / 100;
      totalFuel += minJumpFuel + additionalFuel;
    }
    return {
      reactionDrive: reactionFuel,
      jumpDrive: jumpFuel,
      powerPlant: powerPlantFuel,
      total: totalFuel
    };
  };

  const fuelRequirements = calculateFuelRequirements();

  // Calculate recommended minimum tons for selected power plant
  const getRecommendedPowerPlantTons = (plant: PowerPlant | null) => {
    if (!plant) return shipSize;
    const minRequired = stats.powerRequired.basicSystems + stats.powerRequired.manoeuvre;
    return Math.ceil(minRequired / plant.powerPerTon);
  };

  // When selectedPowerPlant changes, set default tons if not user-set
  useEffect(() => {
    if (selectedPowerPlant && !userSetPowerPlantTons) {
      const minTons = getRecommendedPowerPlantTons(selectedPowerPlant);
      setPowerPlantTons(minTons);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('powerPlantTons', String(minTons));
      }
    }
    // eslint-disable-next-line
  }, [selectedPowerPlant]);

  // Keep powerPlantTons in sync with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && powerPlantTons !== null) {
      window.localStorage.setItem('powerPlantTons', String(powerPlantTons));
    }
  }, [powerPlantTons]);

  // Update bridge size/cost/DM when relevant state changes
  useEffect(() => {
    let size = getStandardBridgeSize(shipSize);
    let cost = getBridgeCost(shipSize);
    let dm = '';
    if (bridgeType === 'smaller') {
      // One step smaller
      if (shipSize <= 50) size = 1.5; // Cockpit
      else if (shipSize <= 99) size = 3;
      else if (shipSize <= 200) size = 6;
      else if (shipSize <= 1000) size = 10;
      else if (shipSize <= 2000) size = 20;
      else if (shipSize <= 100000) size = 40;
      else size = 60 + 20 * Math.ceil((shipSize - 100000) / 100000) - 20;
      cost = getBridgeCost(shipSize) / 2;
      dm = 'DM-1 to all checks related to spacecraft operations made from within the bridge.';
    } else if (bridgeType === 'command') {
      size = getStandardBridgeSize(shipSize) + 40;
      cost = getBridgeCost(shipSize) + 30;
      dm = 'DM+1 to all Tactics (naval) checks made within the bridge.';
    } else if (bridgeType === 'cockpit') {
      size = 1.5;
      cost = 0.01; // Cr10,000 = MCr0.01
      dm = 'No airlock. Life support for 24 hours.';
    } else if (bridgeType === 'dualCockpit') {
      size = 2.5;
      cost = 0.015; // Cr15,000 = MCr0.015
      dm = 'No airlock. Life support for 24 hours.';
    }
    setBridgeSize(size);
    setBridgeCost(cost);
    setBridgeDM(dm);
  }, [bridgeType, shipSize]);

  // Computer step state (move inside App)
  const [primaryComputer, setPrimaryComputer] = useState<string>('Computer/10');
  const [primaryBis, setPrimaryBis] = useState(false);
  const [primaryFib, setPrimaryFib] = useState(false);
  const [backupEnabled, setBackupEnabled] = useState(false);
  const [backupComputer, setBackupComputer] = useState<string>('Computer/5');
  const [backupBis, setBackupBis] = useState(false);
  const [backupFib, setBackupFib] = useState(false);

  // Helper to get computer details
  const getComputer = (name: string) => computerOptions.find(c => c.name === name);
  const getComputerCost = (name: string, bis: boolean, fib: boolean) => {
    const comp = getComputer(name);
    if (!comp) return 0;
    let cost = comp.cost;
    if (bis && fib) cost *= 2;
    else if (bis || fib) cost *= 1.5;
    return cost;
  };
  const getComputerTL = (name: string) => getComputer(name)?.tl || '';
  const getComputerProcessing = (name: string, bis: boolean) => {
    const comp = getComputer(name);
    if (!comp) return 0;
    return comp.processing + (bis ? 5 : 0);
  };

  // Initialize hardpoints based on hull size
  useEffect(() => {
    if (selectedHull) {
      const numHardpoints = Math.floor(selectedHull.size / 100);
      const newHardpoints: Hardpoint[] = [];
      for (let i = 0; i < numHardpoints; i++) {
        newHardpoints.push({
          id: `hardpoint-${i}`,
          type: 'Fixed Mount',
          isFirmpoint: selectedHull.size < 100
        });
      }
      setHardpoints(newHardpoints);
    }
  }, [selectedHull]);

  // Update hardpoints when spinal mount is added/removed
  useEffect(() => {
    const spinalMounts = hardpoints.filter(hp => 
      hp.type === 'Spinal Mount' && 
      weaponSelections[hp.id]?.weapons[0]?.type
    );
    
    if (spinalMounts.length > 0) {
      // Calculate total hardpoints needed for spinal mounts
      const spinalHardpointsNeeded = spinalMounts.reduce((sum, hp) => {
        const weapon = spinalMountWeapons.find(w => w.name === weaponSelections[hp.id]?.weapons[0]?.type);
        if (!weapon) return sum;
        const tonnage = weaponSelections[hp.id]?.weapons[0]?.tonnage || weapon.baseSize;
        return sum + Math.ceil(tonnage / 100);
      }, 0);

      // Calculate available hardpoints
      const availableHardpoints = Math.floor(selectedHull?.size || 0 / 100);
      
      // If we need more hardpoints than available, remove the spinal mount
      if (spinalHardpointsNeeded > availableHardpoints) {
        const newHardpoints = [...hardpoints];
        const newWeaponSelections = { ...weaponSelections };
        spinalMounts.forEach(hp => {
          const index = newHardpoints.findIndex(h => h.id === hp.id);
          if (index !== -1) {
            newHardpoints[index] = {
              ...newHardpoints[index],
              type: 'Fixed Mount' as Hardpoint['type'],
            };
            delete newWeaponSelections[hp.id];
          }
        });
        setHardpoints(newHardpoints);
        setWeaponSelections(newWeaponSelections);
      }
    }
  }, [hardpoints, weaponSelections, selectedHull]);

  // Add helper function to check if a firmpoint can be upgraded
  const canUpgradeFirmpoint = (index: number) => {
    if (!selectedHull || selectedHull.size >= 100) return false;
    if (upgradedFirmpoint !== null) return false;
    return true;
  };

  // Add helper function to check if a firmpoint can be assigned as barbette
  const canAssignBarbette = (index: number) => {
    if (!selectedHull || selectedHull.size >= 100) return true;
    // For firmpoints, need to check if we have 3 consecutive firmpoints available
    if (selectedHull.size < 100) {
      const availableFirmpoints = hardpoints.filter(h => h.type === 'Fixed Mount' && !h.isUpgradedToTurret).length;
      return availableFirmpoints >= 3;
    }
    return true;
  };

  const calculatePowerRequirements = () => {
    let total = 0;
    
    // Drives
    if (selectedDrives) {
      selectedDrives.forEach(drive => {
        if (drive.requiresPower) {
          total += drive.rating * shipSize * 0.1;
        }
      });
    }
    
    // Power Plant
    if (selectedPowerPlant) {
      total += selectedPowerPlant.powerPerTon * shipSize;
    }
    
    // Bridge
    if (bridgeType === 'standard') {
      total += bridgeSize * 0.1; // 0.1 power per ton of bridge
    }
    
    // Sensors
    if (selectedSensor) {
      const sensor = sensorOptions.find(s => s.name === selectedSensor);
      if (sensor) total += sensor.power;
    }
    
    // Weapons
    hardpoints.forEach(hardpoint => {
      if (hardpoint.type === 'Turret') {
        const weapon = turretWeapons.find(w => w.name === hardpoint.weapon);
        if (weapon) total += weapon.power;
      } else if (hardpoint.type === 'Barbette') {
        const weapon = barbetteWeapons.find(w => w.name === hardpoint.weapon);
        if (weapon) total += weapon.power;
      } else if (hardpoint.type === 'Point Defense') {
        const weapon = pointDefenseWeapons.find(w => w.name === hardpoint.weapon);
        if (weapon) total += weapon.power;
      } else if (hardpoint.type === 'Screen') {
        const screen = screens.find(s => s.name === hardpoint.weapon);
        if (screen) total += screen.power;
      } else if (hardpoint.type === 'Black Globe') {
        total += blackGlobeGenerator.power;
      }
    });
    
    return total;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Traveller Ship Builder</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setStep(0)} disabled={step === 0}>Step 0: Initial Parameters</button>
        <button onClick={() => setStep(1)} disabled={step === 1}>Step 1: Hull</button>
        <button onClick={() => setStep(2)} disabled={step === 2}>Step 2: Drives</button>
        <button onClick={() => setStep(3)} disabled={step === 3}>Step 3: Power Plant</button>
        <button onClick={() => setStep(4)} disabled={step === 4}>Step 4: Fuel Tanks</button>
        <button onClick={() => setStep(5)} disabled={step === 5}>Step 5: Bridge</button>
        <button onClick={() => setStep(6)} disabled={step === 6}>Step 6: Computer</button>
        <button onClick={() => setStep(7)} disabled={step === 7}>Step 7: Sensors</button>
        <button onClick={() => setStep(8)} disabled={step === 8}>Step 8: Weapons</button>
      </div>

      {errors.length > 0 && (
        <div style={{ color: 'red', marginBottom: '20px' }}>
          <h3>Errors:</h3>
          {errors.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      {step === 0 && (
      <div>
          <h2>Initial Parameters</h2>
          <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3>Tech Level</h3>
              <p>The tech level determines what components and options are available for your ship.</p>
              <label>
                Tech Level:
                <input 
                  type="number" 
                  value={techLevel} 
                  onChange={(e) => setTechLevel(Number(e.target.value))}
                  min="7"
                  max="20"
                />
              </label>
      </div>

            <div style={{ marginTop: '20px' }}>
              <h3>Ship Size</h3>
              <p>The size of your ship determines many aspects of its design, including:</p>
              <ul>
                <li>Available hull configurations</li>
                <li>Drive requirements</li>
                <li>Power plant needs</li>
                <li>Fuel capacity</li>
                <li>Overall cost</li>
              </ul>
              <div style={{ marginTop: '20px' }}>
                <label>
                  Ship Size (tons):
                  <input
                    type="number"
                    value={shipSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setShipSize(newSize);
                      // Update selected hull with new size if it exists
                      if (selectedHull) {
                        const hullPoints = calculateHullPoints(newSize);
                        const cost = calculateHullCost(newSize, selectedHull.type);
                        setSelectedHull({
                          ...selectedHull,
                          size: newSize,
                          cost,
                          hullPoints
                        });
                      }
                    }}
                    min="100"
                    max="1000000"
                    step="100"
                  />
                </label>
                <p style={{ marginTop: '10px' }}>
                  <strong>Note:</strong> Ship size must be at least 100 tons and cannot exceed 1,000,000 tons.
        </p>
      </div>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2>Select Hull</h2>
          <p>Available hulls for {shipSize} ton ship:</p>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Hull Configuration</h3>
            {Object.entries(hullConfigurations).map(([type, config]) => {
              const isSelected = selectedHull?.type === type;
              return (
                <div 
                  key={type} 
                  style={{ 
                    marginBottom: '20px', 
                    padding: '10px', 
                    border: '1px solid #ccc',
                    backgroundColor: isSelected ? '#f0f0f0' : '#ffffff',
                    cursor: 'pointer',
                    color: '#000000'
                  }}
                  onClick={() => {
                    const hullPoints = calculateHullPoints(shipSize);
                    const cost = calculateHullCost(shipSize, type);
                    const newHull: Hull = {
                      type: type as Hull['type'],
                      size: shipSize,
                      specializedType: selectedHull?.specializedType,
                      additionalType: selectedHull?.additionalType,
                      options: {
                        heatShielding: false,
                        radiationShielding: false,
                        reflec: false,
                        solarCoating: false,
                        stealth: undefined
                      },
                      armour: selectedHull?.armour || {
                        type: 'Titanium Steel',
                        protection: 0
                      },
                      cost,
                      hullPoints,
                      minTechLevel: 7
                    };
                    setSelectedHull(newHull);
                    setErrors([]);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="hullConfig"
                      checked={isSelected}
                      onChange={() => {}} // Handled by div onClick
                    />
                    <div>
                      <h4 style={{ margin: '0 0 10px 0' }}>{type}</h4>
                      <p style={{ margin: '0 0 10px 0' }}>{config.description}</p>
                      <ul style={{ margin: '0' }}>
                        <li>Streamlined: {config.streamlined}</li>
                        <li>Volume Modifier: {config.volumeModifier * 100}%</li>
                        <li>Hull Points Modifier: {config.hullPointsModifier * 100}%</li>
                        <li>Cost Modifier: {config.costModifier * 100}%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Specialized Hull Types</h3>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="radio"
                name="specializedHull"
                checked={selectedHull?.specializedType === undefined}
                onChange={() => {
                  if (selectedHull) {
                    const newHull = { ...selectedHull };
                    newHull.specializedType = undefined;
                    // Reset hull points and cost to base values
                    newHull.hullPoints = calculateHullPoints(shipSize);
                    newHull.cost = calculateHullCost(shipSize, selectedHull.type);
                    setSelectedHull(newHull);
                  }
                }}
              />
              <label>None</label>
            </div>
            {Object.entries(specializedHullTypes).map(([type, details]) => (
              <div key={type} style={{ marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="specializedHull"
                  checked={selectedHull?.specializedType === type}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull = { ...selectedHull };
                      newHull.specializedType = type as Hull['specializedType'];
                      // Recalculate hull points and cost based on specialized type
                      const specMod = specializedHullTypes[type as keyof typeof specializedHullTypes];
                      newHull.hullPoints = Math.floor(newHull.hullPoints * (1 + specMod.hullPointsModifier));
                      newHull.cost = newHull.cost * (1 + specMod.costModifier);
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={type === 'Military' && shipSize <= 5000 || type === 'Non-Gravity' && shipSize > 500000}
                />
                <label>
                  {type} - {details.description}
                </label>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Additional Hull Types</h3>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="radio"
                name="additionalHull"
                checked={selectedHull?.additionalType === undefined}
                onChange={() => {
                  if (selectedHull) {
                    const newHull = { ...selectedHull };
                    newHull.additionalType = undefined;
                    // Reset cost to base value
                    newHull.cost = calculateHullCost(shipSize, selectedHull.type);
                    setSelectedHull(newHull);
                  }
                }}
              />
              <label>None</label>
            </div>
            {Object.entries(additionalHullTypes).map(([type, details]) => (
              <div key={type} style={{ marginBottom: '10px' }}>
                <input
                  type="radio"
                  name="additionalHull"
                  checked={selectedHull?.additionalType === type}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull = { ...selectedHull };
                      newHull.additionalType = type as Hull['additionalType'];
                      // Recalculate cost based on additional type
                      const addMod = additionalHullTypes[type as keyof typeof additionalHullTypes];
                      if (type === 'Breakaway Hulls') {
                        newHull.cost += shipSize * addMod.costModifier;
                      } else {
                        newHull.cost *= (1 + addMod.costModifier);
                      }
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={type === 'Double Hull' && shipSize < 60}
                />
                <label>
                  {type} - {details.description}
                </label>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Hull Options</h3>
            <p>Hulls can be further modified with a range of options to create specialised ships. Each option can only be added once.</p>
            
            {/* Heat Shielding */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedHull?.options.heatShielding || false}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull: Hull = {
                        ...selectedHull,
                        options: {
                          ...selectedHull.options,
                          heatShielding: !selectedHull.options.heatShielding
                        }
                      };
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={techLevel < 6}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Heat Shielding (TL6)</h4>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Protects against re-entry heat and star proximity. Required for safe re-entry without gravitic drive.
                    Costs MCr0.1 per ton of hull.
                  </p>
                  {techLevel < 6 && <span style={{ color: 'red' }}>Requires TL6</span>}
                </div>
              </div>
            </div>

            {/* Radiation Shielding */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedHull?.options.radiationShielding || false}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull: Hull = {
                        ...selectedHull,
                        options: {
                          ...selectedHull.options,
                          radiationShielding: !selectedHull.options.radiationShielding
                        }
                      };
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={techLevel < 7}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Radiation Shielding (TL7)</h4>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Improves crew protection against radiation. Decreases rads absorbed by 1,000 and hardens bridge.
                    Costs Cr25,000 per ton of hull.
                  </p>
                  {techLevel < 7 && <span style={{ color: 'red' }}>Requires TL7</span>}
                </div>
              </div>
            </div>

            {/* Reflec */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedHull?.options.reflec || false}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull: Hull = {
                        ...selectedHull,
                        options: {
                          ...selectedHull.options,
                          reflec: !selectedHull.options.reflec,
                          stealth: selectedHull.options.reflec ? selectedHull.options.stealth : undefined
                        }
                      };
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={techLevel < 10 || selectedHull?.options.stealth !== undefined}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Reflec (TL10)</h4>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Increases Protection against lasers by +3. Cannot be combined with Stealth.
                    Costs MCr0.1 per ton of hull.
                  </p>
                  {techLevel < 10 && <span style={{ color: 'red' }}>Requires TL10</span>}
                  {selectedHull?.options.stealth !== undefined && 
                    <span style={{ color: 'red' }}>Cannot be combined with Stealth</span>}
                </div>
              </div>
            </div>

            {/* Solar Coating */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedHull?.options.solarCoating || false}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull: Hull = {
                        ...selectedHull,
                        options: {
                          ...selectedHull.options,
                          solarCoating: !selectedHull.options.solarCoating,
                          reflec: selectedHull.options.solarCoating ? selectedHull.options.reflec : false,
                          stealth: selectedHull.options.solarCoating ? selectedHull.options.stealth : undefined
                        }
                      };
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={selectedHull?.options.reflec || selectedHull?.options.stealth !== undefined}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Solar Coating</h4>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Provides backup power and flexibility. Can only be combined with radiation shielding.
                    See Solar Energy Systems for details.
                  </p>
                  {(selectedHull?.options.reflec || selectedHull?.options.stealth !== undefined) && 
                    <span style={{ color: 'red' }}>Cannot be combined with Reflec or Stealth</span>}
                </div>
              </div>
            </div>

            {/* Stealth */}
            <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={selectedHull?.options.stealth !== undefined}
                  onChange={() => {
                    if (selectedHull) {
                      const newHull: Hull = {
                        ...selectedHull,
                        options: {
                          ...selectedHull.options,
                          stealth: selectedHull.options.stealth ? undefined : { type: 'Basic' as const },
                          reflec: false,
                          solarCoating: false
                        }
                      };
                      setSelectedHull(newHull);
                    }
                  }}
                  disabled={techLevel < 8 || selectedHull?.options.reflec || selectedHull?.options.solarCoating}
                />
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Stealth</h4>
                  <p style={{ margin: '0 0 5px 0' }}>
                    Absorbs radar and lidar beams, disguises heat emissions. Cannot be combined with Reflec or Solar Coating.
                  </p>
                  {techLevel < 8 && <span style={{ color: 'red' }}>Requires TL8</span>}
                  {(selectedHull?.options.reflec || selectedHull?.options.solarCoating) && 
                    <span style={{ color: 'red' }}>Cannot be combined with Reflec or Solar Coating</span>}
                  
                  {selectedHull?.options.stealth && (
                    <div style={{ marginTop: '10px' }}>
                      <select
                        value={selectedHull.options.stealth.type}
                        onChange={(e) => {
                          if (selectedHull) {
                            const newHull: Hull = {
                              ...selectedHull,
                              options: {
                                ...selectedHull.options,
                                stealth: { 
                                  type: e.target.value as 'Basic' | 'Improved' | 'Enhanced' | 'Advanced'
                                }
                              }
                            };
                            setSelectedHull(newHull);
                          }
                        }}
                      >
                        <option value="Basic" disabled={techLevel < 8}>Basic (TL8) - MCr0.04/ton, DM-2, 2% hull</option>
                        <option value="Improved" disabled={techLevel < 10}>Improved (TL10) - MCr0.1/ton, DM-2</option>
                        <option value="Enhanced" disabled={techLevel < 12}>Enhanced (TL12) - MCr0.5/ton, DM-4</option>
                        <option value="Advanced" disabled={techLevel < 14}>Advanced (TL14) - MCr1.0/ton, DM-6</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Select Drives</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>Manoeuvre Drive</h3>
            <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '6px' }}>
              Manoeuvre drive systems include thrusters and gravitic compensation (also called G compensators).
            </div>
            <select 
              value={selectedDrives.find(d => d.type === 'Manoeuvre')?.rating ?? 'none'} 
              onChange={(e) => {
                if (e.target.value === 'none') {
                  setSelectedDrives(selectedDrives.filter(d => d.type !== 'Manoeuvre'));
                  return;
                }
                const rating = Number(e.target.value);
                const drive = manoeuvreDrives.find(d => d.rating === rating);
                if (drive) {
                  setSelectedDrives([
                    ...selectedDrives.filter(d => d.type !== 'Manoeuvre'),
                    drive
                  ]);
                }
              }}
              disabled={manoeuvreDrives.every(d => d.minTechLevel > techLevel)}
            >
              <option value="none">Not Installed</option>
              {manoeuvreDrives.map(drive => (
                <option 
                  key={drive.rating} 
                  value={drive.rating}
                  disabled={drive.minTechLevel > techLevel}
                >
                  Rating {drive.rating} ({drive.percentOfHull}% of hull, TL{drive.minTechLevel})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Jump Drive</h3>
            <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '6px' }}>
              Jump drives allow a ship to travel faster-than-light across interstellar distances. The Rating represents how many parsecs a ship can jump in one use.
            </div>
            <select 
              value={selectedDrives.find(d => d.type === 'Jump')?.rating ?? 'none'} 
              onChange={(e) => {
                if (e.target.value === 'none') {
                  setSelectedDrives(selectedDrives.filter(d => d.type !== 'Jump'));
                  return;
                }
                const rating = Number(e.target.value);
                const drive = jumpDrives.find(d => d.rating === rating);
                if (drive) {
                  setSelectedDrives([
                    ...selectedDrives.filter(d => d.type !== 'Jump'),
                    drive
                  ]);
                }
              }}
              disabled={jumpDrives.every(d => d.minTechLevel > techLevel)}
            >
              <option value="none">Not Installed</option>
              {jumpDrives.map(drive => (
                <option 
                  key={drive.rating} 
                  value={drive.rating}
                  disabled={drive.minTechLevel > techLevel}
                >
                  Rating {drive.rating} ({drive.percentOfHull}% of hull, TL{drive.minTechLevel})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Reaction Drive</h3>
            <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '6px' }}>
              Reaction drives are similar to manoeuvre drives but act as giant thrusters, exhausting gases to push the ship forward like today's rockets.<br />
              <span style={{ fontStyle: 'italic', color: '#ccc' }}>
                Mostly found in 'primitive' technology; most high-tech ships do not have these in conjunction with Manoeuvre Drives. In rare instances they may be installed as backup propulsion.
              </span>
            </div>
            <select 
              value={selectedDrives.find(d => d.type === 'Reaction')?.rating ?? 'none'} 
              onChange={(e) => {
                if (e.target.value === 'none') {
                  setSelectedDrives(selectedDrives.filter(d => d.type !== 'Reaction'));
                  return;
                }
                const rating = Number(e.target.value);
                const drive = reactionDrives.find(d => d.rating === rating);
                if (drive) {
                  setSelectedDrives([
                    ...selectedDrives.filter(d => d.type !== 'Reaction'),
                    drive
                  ]);
                }
              }}
              disabled={reactionDrives.every(d => d.minTechLevel > techLevel)}
            >
              <option value="none">Not Installed</option>
              {reactionDrives.map(drive => (
                <option 
                  key={drive.rating} 
                  value={drive.rating}
                  disabled={drive.minTechLevel > techLevel}
                >
                  Rating {drive.rating} ({drive.percentOfHull}% of hull, TL{drive.minTechLevel})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Select Power Plant</h2>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: '#bbb', background: '#222', padding: '10px', borderRadius: '4px' }}>
            <strong>Note:</strong> It is considered good practice to ensure there is enough Power available to use the basic ship systems and the manoeuvre drive simultaneously – being able to use the jump drive at the same time without taking power from other systems is considered a good advantage. You should also note that most weapons and certain types of equipment require additional Power, as noted in their descriptions in the following chapters.
          </div>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* Power Plant Type Selection */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3>Type</h3>
              {Object.entries(powerPlantDescriptions).map(([type, description]) => (
                <div key={type} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
                  <h4 style={{ margin: '0 0 6px 0' }}>{type}</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#888' }}>{description}</p>
                  <div>
                    {powerPlants.filter(p => p.type === type).map((plant, index) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <input
                          type="radio"
                          name="powerPlant"
                          checked={selectedPowerPlant === plant}
                          onChange={() => setSelectedPowerPlant(plant)}
                          disabled={plant.techLevel > techLevel}
                        />
                        TL{plant.techLevel} - Power: {plant.powerPerTon}/ton, Cost: {plant.costPerTon} MCr/ton
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Power Plant Sizing and Power Calculation */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <h3>Power Plant Size</h3>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Tons Installed:
                  <input
                    type="number"
                    min="1"
                    max={shipSize * 2}
                    value={powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)}
                    onChange={e => {
                      const tons = Number(e.target.value);
                      setPowerPlantTons(tons);
                      setUserSetPowerPlantTons(true);
                    }}
                    style={{ marginLeft: 8, width: 80 }}
                  />
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Power Available: </strong>
                {selectedPowerPlant && powerPlantTons !== null ? selectedPowerPlant.powerPerTon * powerPlantTons : 0}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Power Required:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '13px' }}>
                  <li>Basic Ship Systems: {stats.powerRequired.basicSystems}</li>
                  <li>Manoeuvre Drive: {stats.powerRequired.manoeuvre}</li>
                  <li>Jump Drive: {stats.powerRequired.jump}</li>
                  <li style={{ fontWeight: 600 }}>Recommended Minimum: {stats.powerRequired.basicSystems + stats.powerRequired.manoeuvre}</li>
                  <li style={{ fontWeight: 600 }}>Ideal: {stats.powerRequired.basicSystems + stats.powerRequired.manoeuvre + stats.powerRequired.jump}</li>
                </ul>
              </div>
              {/* Visual Feedback */}
              {selectedPowerPlant && (() => {
                const tons = powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant);
                const available = selectedPowerPlant.powerPerTon * tons;
                const min = stats.powerRequired.basicSystems + stats.powerRequired.manoeuvre;
                const ideal = min + stats.powerRequired.jump;
                let color = '#f58220';
                let msg = 'Insufficient power!';
                if (available >= ideal) {
                  color = '#4caf50';
                  msg = 'Ideal: All systems can be powered simultaneously.';
                } else if (available >= min) {
                  color = '#ffc107';
                  msg = 'Meets minimum: Basic and Manoeuvre can be powered.';
                }
                return <div style={{ color, fontWeight: 600, marginTop: 8 }}>{msg}</div>;
              })()}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2>Fuel Requirements</h2>
          
          {selectedDrives.find(d => d.type === 'Reaction') && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
              <h3>Reaction Drive Fuel</h3>
              <p>Reaction drives require 2.5% of ship tonnage per Thrust per hour.</p>
              <div>
                <label>
                  Hours of Operation:
                  <input
                    type="number"
                    value={reactionDriveHours}
                    onChange={(e) => setReactionDriveHours(Number(e.target.value))}
                    min="1"
                  />
                </label>
                <p>Required Fuel: {fuelRequirements.reactionDrive.toFixed(1)} tons</p>
                <p>Total Thrust Available: {(selectedDrives.find(d => d.type === 'Reaction')?.rating || 0) * reactionDriveHours * 10}</p>
              </div>
            </div>
          )}

          {selectedDrives.find(d => d.type === 'Jump') && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', background: '#222', color: '#fff' }}>
              <h3>Jump Drive Fuel</h3>
              <p>Jump drives require 10% of ship tonnage × Jump rating <b>per jump</b>.</p>
              <div style={{ marginBottom: '10px' }}>
                {(() => {
                  const minJumpFuel = ((selectedHull?.size || 0) * 10 * (selectedDrives.find(d => d.type === 'Jump')?.rating || 1) / 100);
                  return (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Minimum Required Fuel: {minJumpFuel.toFixed(1)} tons</strong>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedPowerPlant && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', background: '#222', color: '#fff' }}>
              <h3>Power Plant Fuel</h3>
              {selectedPowerPlant.type === 'Chemical' ? (
                <p>Chemical power plants require 10 tons per ton of power plant per 2 weeks.</p>
              ) : (
                <p>Other power plants require 10% of their size per month (minimum 1 ton).</p>
              )}
              <div>
                <label>
                  Weeks of Operation:
                  <input
                    type="number"
                    value={powerPlantWeeks}
                    onChange={(e) => setPowerPlantWeeks(Number(e.target.value))}
                    min="1"
                  />
                </label>
                <p>Required Fuel: {fuelRequirements.powerPlant.toFixed(1)} tons</p>
              </div>
            </div>
          )}

          {/* Additional Fuel box after Power Plant Fuel */}
          {step === 4 && (
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', background: '#222', color: '#fff' }}>
              <h3>Additional Fuel for Operations and/or Additional Jumps</h3>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={fineAdjustment}
                    onChange={e => setFineAdjustment(e.target.checked)}
                    style={{ marginRight: 6 }}
                  />
                  Fine Adjustment (1-ton increments)
                </label>
              </div>
              <label>
                <input
                  type="number"
                  min={0}
                  step={fineAdjustment ? 1 : 10}
                  value={additionalFuel}
                  onChange={e => setAdditionalFuel(Math.max(0, Number(e.target.value)))}
                  style={{ marginLeft: 8, width: 80 }}
                />
                <span style={{ marginLeft: 8, fontSize: '12px', color: '#bbb' }}>tons</span>
              </label>
            </div>
          )}

          <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#222' }}>
            <h3>Total Fuel Requirements</h3>
            <p>Total Fuel Required: {fuelRequirements.total.toFixed(1)} tons</p>
            <p>Percentage of Ship: {((fuelRequirements.total / (selectedHull?.size || 1)) * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2>Install Bridge</h2>
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#bbb', background: '#222', padding: '10px', borderRadius: '4px' }}>
            All ships must have a bridge or cockpit. The size and cost depend on ship tonnage and options below.
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>Ship Tonnage:</strong> {shipSize} tons
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              <input type="radio" name="bridgeType" value="standard" checked={bridgeType === 'standard'} onChange={() => setBridgeType('standard')} />
              Standard Bridge ({getStandardBridgeSize(shipSize)} tons, MCr{getBridgeCost(shipSize).toFixed(3)})
            </label>
            <br />
            {shipSize > 50 && (
              <label>
                <input type="radio" name="bridgeType" value="smaller" checked={bridgeType === 'smaller'} onChange={() => setBridgeType('smaller')} />
                Smaller Bridge (one step smaller, half cost, DM-1 to all checks)
              </label>
            )}
            {shipSize > 5000 && (
              <><br /><label>
                <input type="radio" name="bridgeType" value="command" checked={bridgeType === 'command'} onChange={() => setBridgeType('command')} />
                Command Bridge (adds 40 tons, +MCr30, DM+1 to Tactics (naval) checks)
              </label></>)
            }
            {shipSize <= 50 && (
              <>
                <br /><label>
                  <input type="radio" name="bridgeType" value="cockpit" checked={bridgeType === 'cockpit'} onChange={() => setBridgeType('cockpit')} />
                  Cockpit (1.5 tons, Cr10,000, no airlock, 24h life support)
                </label>
                <br /><label>
                  <input type="radio" name="bridgeType" value="dualCockpit" checked={bridgeType === 'dualCockpit'} onChange={() => setBridgeType('dualCockpit')} />
                  Dual Cockpit (2.5 tons, Cr15,000, no airlock, 24h life support)
                </label>
              </>
            )}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Selected Bridge:</strong> {(() => {
              if (bridgeType === 'standard') return 'Standard Bridge';
              if (bridgeType === 'smaller') return 'Smaller Bridge';
              if (bridgeType === 'command') return 'Command Bridge';
              if (bridgeType === 'cockpit') return 'Cockpit';
              if (bridgeType === 'dualCockpit') return 'Dual Cockpit';
              return '';
            })()}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Bridge Size:</strong> {bridgeSize} tons
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Bridge Cost:</strong> MCr{bridgeCost.toFixed(3)}
          </div>
          {bridgeDM && (
            <div style={{ marginBottom: '10px', color: '#f58220', fontWeight: 600 }}>{bridgeDM}</div>
          )}
        </div>
      )}

      {step === 6 && (
        <div>
          <h2>Install Computer</h2>
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#bbb', background: '#222', padding: '10px', borderRadius: '4px' }}>
            Every ship needs a central computer. Computer cores are always available, but are typically used on capital or specialized ships.
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>Primary Computer (required):</strong>
            <select value={primaryComputer} onChange={e => {
              setPrimaryComputer(e.target.value);
              // If backup is enabled and backup is not lower, reset backup
              const primaryProc = getComputerProcessing(e.target.value, primaryBis);
              const backupProc = getComputerProcessing(backupComputer, backupBis);
              if (backupEnabled && backupProc >= primaryProc) {
                setBackupComputer('Computer/5');
                setBackupBis(false);
                setBackupFib(false);
              }
            }}>
              {computerOptions.map(opt => (
                <option key={opt.name} value={opt.name}>
                  {opt.name} (TL{opt.tl}, {opt.cost >= 1 ? `MCr${opt.cost}` : `Cr${(opt.cost * 1000).toLocaleString()}`})
                </option>
              ))}
            </select>
            <label style={{ marginLeft: 12 }}>
              <input type="checkbox" checked={primaryBis} onChange={e => setPrimaryBis(e.target.checked)} /> Jump Control Specialisation (/bis)
            </label>
            <label style={{ marginLeft: 12 }}>
              <input type="checkbox" checked={primaryFib} onChange={e => setPrimaryFib(e.target.checked)} /> Hardened Systems (/fib)
            </label>
            <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
              Processing: {getComputerProcessing(primaryComputer, primaryBis)} | TL: {getComputerTL(primaryComputer)} | Cost: {getComputerCost(primaryComputer, primaryBis, primaryFib) >= 1 ? `MCr${getComputerCost(primaryComputer, primaryBis, primaryFib)}` : `Cr${(getComputerCost(primaryComputer, primaryBis, primaryFib) * 1000).toLocaleString()}`}
            </div>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              <input type="checkbox" checked={backupEnabled} onChange={e => setBackupEnabled(e.target.checked)} /> Install Backup Computer?
            </label>
            {backupEnabled && (
              <div style={{ marginTop: 8, marginLeft: 16 }}>
                <strong>Backup Computer (must be lower Processing than primary):</strong>
                <select value={backupComputer} onChange={e => setBackupComputer(e.target.value)}>
                  {computerOptions.filter(opt => getComputerProcessing(opt.name, backupBis) < getComputerProcessing(primaryComputer, primaryBis)).map(opt => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name} (TL{opt.tl}, {opt.cost >= 1 ? `MCr${opt.cost}` : `Cr${(opt.cost * 1000).toLocaleString()}`})
                    </option>
                  ))}
                </select>
                <label style={{ marginLeft: 12 }}>
                  <input type="checkbox" checked={backupBis} onChange={e => setBackupBis(e.target.checked)} /> Jump Control Specialisation (/bis)
                </label>
                <label style={{ marginLeft: 12 }}>
                  <input type="checkbox" checked={backupFib} onChange={e => setBackupFib(e.target.checked)} /> Hardened Systems (/fib)
                </label>
                <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
                  Processing: {getComputerProcessing(backupComputer, backupBis)} | TL: {getComputerTL(backupComputer)} | Cost: {getComputerCost(backupComputer, backupBis, backupFib) >= 1 ? `MCr${getComputerCost(backupComputer, backupBis, backupFib)}` : `Cr${(getComputerCost(backupComputer, backupBis, backupFib) * 1000).toLocaleString()}`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 7 && (
        <div>
          <h2>Install Sensors</h2>
          <div style={{ marginBottom: '20px', fontSize: '13px', color: '#bbb', background: '#222', padding: '10px', borderRadius: '4px' }}>
            All ships have Basic sensors unless upgraded. The DM column is applied to all Electronics (comms) and Electronics (sensors) checks made by crew in the ship.
          </div>
          <div style={{ marginBottom: '20px' }}>
            {sensorOptions.map(opt => (
              <div key={opt.name} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #444', background: selectedSensor === opt.name ? '#333' : '#181818', color: '#fff', borderRadius: 4 }}>
                <label>
                  <input
                    type="radio"
                    name="sensorSuite"
                    value={opt.name}
                    checked={selectedSensor === opt.name}
                    onChange={() => setSelectedSensor(opt.name)}
                    style={{ marginRight: 8 }}
                  />
                  <strong>{opt.name}</strong> (TL{opt.tl})
                </label>
                <div style={{ fontSize: '12px', marginTop: 4 }}>
                  <div><strong>Suite:</strong> {opt.suite}</div>
                  <div><strong>DM:</strong> {opt.dm > 0 ? '+' : ''}{opt.dm}</div>
                  <div><strong>Power:</strong> {opt.power}</div>
                  <div><strong>Tons:</strong> {opt.tons}</div>
                  <div><strong>Cost:</strong> {opt.cost === 0 ? '—' : `MCr${opt.cost}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 8 && (
        <div>
          <h2>Install Weapons</h2>
          <div style={{ marginBottom: '20px' }}>
            <h3>Available {selectedHull && selectedHull.size < 100 ? 'Firmpoints' : 'Hardpoints'}</h3>
            <p>Your {selectedHull?.size} ton ship has {hardpoints.length} {selectedHull && selectedHull.size < 100 ? 'firmpoints' : 'hardpoints'} available.</p>
            
            {selectedHull && selectedHull.size < 100 && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#222', borderRadius: '4px', color: '#fff' }}>
                <h4>Firmpoint Rules</h4>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>Weapons of Medium range or less are reduced to Adjacent range</li>
                  <li>Weapons of Long or greater are reduced to Close range</li>
                  <li>A weapon on a Firmpoint may not have its range increased beyond Close by any means</li>
                  <li>Firmpoint range limitations do not apply to missiles and torpedoes</li>
                  <li>Power requirements of the weapon are reduced by 25% (rounding up)</li>
                  <li>Barbettes consume three Firmpoints</li>
                  <li>One (and only one) Firmpoint can be upgraded to a single turret</li>
                </ul>
              </div>
            )}
            
            <div style={{ marginTop: '20px' }}>

              <h4>Defensive Systems</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {/* None option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15 }}>
                  <input
                    type="checkbox"
                    checked={hardpoints.every(hp => !['Screen', 'Point Defense', 'Black Globe'].includes(hp.type))}
                    onChange={() => {
                      // Remove all defensive systems
                      const newHardpoints = hardpoints.map(hp =>
                        ['Screen', 'Point Defense', 'Black Globe'].includes(hp.type)
                          ? { ...hp, type: 'Fixed Mount' as Hardpoint['type'], weapon: undefined, ammo: undefined }
                          : hp
                      );
                      setHardpoints(newHardpoints);
                    }}
                  />
                  <span>None</span>
                </div>
                {/* Screens */}
                {screens.map(screen => {
                  const assignedIndex = hardpoints.findIndex(hp => hp.type === 'Screen' && hp.weapon === screen.name);
                  const isSelected = assignedIndex !== -1;
                  const availableIndex = hardpoints.findIndex(hp => {
                    if (!(hp.type === 'Fixed Mount' || hp.type === 'Turret')) return false;
                    if (hp.weapon) return false;
                    const sel = weaponSelections[hp.id];
                    if (sel && sel.weapons.some(w => w.type)) return false;
                    return true;
                  });
                  const isDisabled = !isSelected && availableIndex === -1;
                  return (
                    <div key={screen.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={e => {
                          if (e.target.checked) {
                            if (availableIndex !== -1) {
                              const newHardpoints = [...hardpoints];
                              newHardpoints[availableIndex] = {
                                ...newHardpoints[availableIndex],
                                type: 'Screen',
                                weapon: screen.name
                              };
                              // Clear weaponSelections for this hardpoint
                              const newWeaponSelections = { ...weaponSelections };
                              delete newWeaponSelections[newHardpoints[availableIndex].id];
                              setHardpoints(newHardpoints);
                              setWeaponSelections(newWeaponSelections);
                            }
                          } else if (isSelected) {
                            const newHardpoints = [...hardpoints];
                            newHardpoints[assignedIndex] = {
                              ...newHardpoints[assignedIndex],
                              type: 'Fixed Mount',
                              weapon: undefined
                            };
                            // Clear weaponSelections for this hardpoint
                            const newWeaponSelections = { ...weaponSelections };
                            delete newWeaponSelections[newHardpoints[assignedIndex].id];
                            setHardpoints(newHardpoints);
                            setWeaponSelections(newWeaponSelections);
                          }
                        }}
                        style={{ marginTop: 2 }}
                      />
                      <span><strong>{screen.name}</strong> - {screen.effect}</span>
                      {isDisabled && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>No available hardpoints</span>}
                    </div>
                  );
                })}
                {/* Point Defense */}
                {pointDefenseWeapons.map(weapon => {
                  const assignedIndex = hardpoints.findIndex(hp => hp.type === 'Point Defense' && hp.weapon === weapon.name);
                  const isSelected = assignedIndex !== -1;
                  const availableIndex = hardpoints.findIndex(hp => {
                    if (!(hp.type === 'Fixed Mount' || hp.type === 'Turret')) return false;
                    if (hp.weapon) return false;
                    const sel = weaponSelections[hp.id];
                    if (sel && sel.weapons.some(w => w.type)) return false;
                    return true;
                  });
                  const isDisabled = !isSelected && availableIndex === -1;
                  return (
                    <div key={weapon.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={e => {
                          if (e.target.checked) {
                            if (availableIndex !== -1) {
                              const newHardpoints = [...hardpoints];
                              newHardpoints[availableIndex] = {
                                ...newHardpoints[availableIndex],
                                type: 'Point Defense',
                                weapon: weapon.name,
                                ammo: weapon.ammo ? { tons: 1, rounds: weapon.ammo.rounds } : undefined
                              };
                              // Clear weaponSelections for this hardpoint
                              const newWeaponSelections = { ...weaponSelections };
                              delete newWeaponSelections[newHardpoints[availableIndex].id];
                              setHardpoints(newHardpoints);
                              setWeaponSelections(newWeaponSelections);
                            }
                          } else if (isSelected) {
                            const newHardpoints = [...hardpoints];
                            newHardpoints[assignedIndex] = {
                              ...newHardpoints[assignedIndex],
                              type: 'Fixed Mount',
                              weapon: undefined,
                              ammo: undefined
                            };
                            // Clear weaponSelections for this hardpoint
                            const newWeaponSelections = { ...weaponSelections };
                            delete newWeaponSelections[newHardpoints[assignedIndex].id];
                            setHardpoints(newHardpoints);
                            setWeaponSelections(newWeaponSelections);
                          }
                        }}
                        style={{ marginTop: 2 }}
                      />
                      <span><strong>{weapon.name}</strong> - Intercept {weapon.intercept}</span>
                      {isDisabled && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>No available hardpoints</span>}
                    </div>
                  );
                })}
                {/* Black Globe Generator */}
                {(() => {
                  const assignedIndex = hardpoints.findIndex(hp => hp.type === 'Black Globe');
                  const isSelected = assignedIndex !== -1;
                  const availableIndex = hardpoints.findIndex(hp => {
                    if (!(hp.type === 'Fixed Mount' || hp.type === 'Turret')) return false;
                    if (hp.weapon) return false;
                    const sel = weaponSelections[hp.id];
                    if (sel && sel.weapons.some(w => w.type)) return false;
                    return true;
                  });
                  const isDisabled = techLevel < 15 || (!isSelected && availableIndex === -1);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 15, opacity: techLevel < 15 ? 0.5 : 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={e => {
                          if (e.target.checked) {
                            if (availableIndex !== -1 && techLevel >= 15) {
                              const newHardpoints = [...hardpoints];
                              newHardpoints[availableIndex] = {
                                ...newHardpoints[availableIndex],
                                type: 'Black Globe',
                                weapon: blackGlobeGenerator.name
                              };
                              // Clear weaponSelections for this hardpoint
                              const newWeaponSelections = { ...weaponSelections };
                              delete newWeaponSelections[newHardpoints[availableIndex].id];
                              setHardpoints(newHardpoints);
                              setWeaponSelections(newWeaponSelections);
                            }
                          } else if (isSelected) {
                            const newHardpoints = [...hardpoints];
                            newHardpoints[assignedIndex] = {
                              ...newHardpoints[assignedIndex],
                              type: 'Fixed Mount',
                              weapon: undefined
                            };
                            // Clear weaponSelections for this hardpoint
                            const newWeaponSelections = { ...weaponSelections };
                            delete newWeaponSelections[newHardpoints[assignedIndex].id];
                            setHardpoints(newHardpoints);
                            setWeaponSelections(newWeaponSelections);
                          }
                        }}
                        style={{ marginTop: 2 }}
                      />
                      <span><strong>Black Globe Generator</strong> - Absorbs all energy attacks.</span>
                      {techLevel < 15 && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>Requires TL15</span>}
                      {isDisabled && techLevel >= 15 && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>No available hardpoints</span>}
                    </div>
                  );
                })()}
              </div>

              <h4>{selectedHull && selectedHull.size < 100 ? 'Firmpoint' : 'Hardpoint'} Assignment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {hardpoints.map((hardpoint, index) => {
                  // Determine if this is a firmpoint and if so, enforce firmpoint rules
                  const isFirmpoint = hardpoint.isFirmpoint;
                  const isUpgradedToTurret = hardpoint.isUpgradedToTurret;
                  const isBarbette = hardpoint.type === 'Barbette';
                  const isTurret = hardpoint.type === 'Turret';
                  // For firmpoints: only one weapon, except barbettes (handled by type selection)
                  // For upgraded firmpoint turret: only single turret allowed
                  // For hardpoints: up to 3 weapons for turrets/fixed mounts

                  // Defensive system assignment UI
                  if (["Screen", "Point Defense", "Black Globe"].includes(hardpoint.type)) {
                    return (
                      <div key={hardpoint.id} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '8px', background: '#222', color: '#fff' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          {selectedHull && selectedHull.size < 100 ? 'Firmpoint' : 'Hardpoint'} {index + 1}
                        </div>
                        <div style={{ marginBottom: '8px', fontSize: 15 }}>
                          <span style={{ fontWeight: 500 }}>{hardpoint.weapon || hardpoint.type}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newHardpoints = [...hardpoints];
                            newHardpoints[index] = {
                              ...newHardpoints[index],
                              type: 'Fixed Mount',
                              weapon: undefined,
                              ammo: undefined
                            };
                            // Clear weaponSelections for this hardpoint
                            const newWeaponSelections = { ...weaponSelections };
                            delete newWeaponSelections[hardpoint.id];
                            setHardpoints(newHardpoints);
                            setWeaponSelections(newWeaponSelections);
                          }}
                          style={{ padding: '4px 10px', background: '#f58220', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: 14 }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={hardpoint.id} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        {selectedHull && selectedHull.size < 100 ? 'Firmpoint' : 'Hardpoint'} {index + 1}
                        {isFirmpoint && isUpgradedToTurret && ' (Upgraded to Turret)'}
                      </div>
                      <select
                        value={hardpoint.type}
                        onChange={(e) => {
                          const newType = e.target.value as Hardpoint['type'];
                          const newHardpoints = [...hardpoints];
                          newHardpoints[index] = {
                            ...hardpoint,
                            type: newType
                          };
                          // Reset weaponSelections for this hardpoint to match the new type
                          const newWeaponSelections = { ...weaponSelections };
                          if (["Turret", "Fixed Mount"].includes(newType)) {
                            newWeaponSelections[hardpoint.id] = {
                              mountType: newType,
                              weapons: [{ type: '' }, { type: '' }, { type: '' }],
                              popUp: false
                            };
                          } else if (["Small Bay", "Medium Bay", "Large Bay", "Barbette", "Spinal Mount"].includes(newType)) {
                            newWeaponSelections[hardpoint.id] = {
                              mountType: newType,
                              weapons: [{ type: '' }],
                              popUp: false
                            };
                          } else {
                            // Defensive system or unhandled type: clear selection
                            delete newWeaponSelections[hardpoint.id];
                          }
                          setHardpoints(newHardpoints);
                          setWeaponSelections(newWeaponSelections);
                        }}
                        style={{ width: '100%' }}
                        disabled={isFirmpoint && isUpgradedToTurret}
                      >
                        <option value="Fixed Mount">Fixed Mount</option>
                        <option value="Turret">Turret</option>
                        <option value="Barbette">Barbette</option>
                        <option value="Small Bay">Small Bay</option>
                        <option value="Medium Bay">Medium Bay</option>
                        <option value="Large Bay">Large Bay</option>
                        {selectedHull && selectedHull.size >= 100 && (
                          <>
                            <option value="Spinal Mount">Spinal Mount</option>
                          </>
                        )}
                      </select>
                      {/* Weapon selection UI */}
                      <div style={{ marginTop: 8 }}>
                        {/* Bay weapon selection */}
                        {hardpoint.type === 'Small Bay' && (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Bay Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: weaponSelections[hardpoint.id]?.popUp || false
                                  }
                                });
                              }}
                              style={{ width: '100%', marginBottom: 4 }}
                            >
                              <option value="">—</option>
                              {smallBayWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                          </>
                        )}
                        {hardpoint.type === 'Medium Bay' && (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Bay Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: weaponSelections[hardpoint.id]?.popUp || false
                                  }
                                });
                              }}
                              style={{ width: '100%', marginBottom: 4 }}
                            >
                              <option value="">—</option>
                              {mediumBayWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                          </>
                        )}
                        {hardpoint.type === 'Large Bay' && (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Bay Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: weaponSelections[hardpoint.id]?.popUp || false
                                  }
                                });
                              }}
                              style={{ width: '100%', marginBottom: 4 }}
                            >
                              <option value="">—</option>
                              {largeBayWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                          </>
                        )}
                        {/* Spinal Mount weapon selection */}
                        {hardpoint.type === 'Spinal Mount' && (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Spinal Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: false
                                  }
                                });
                              }}
                              style={{ width: '100%', marginBottom: 4 }}
                            >
                              <option value="">—</option>
                              {spinalMountWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                            {weaponSelections[hardpoint.id]?.weapons[0]?.type && (
                              <>
                                <div style={{ fontSize: 13, marginBottom: 4 }}>Tonnage (multiple of base size):</div>
                                <input
                                  type="number"
                                  min={spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.baseSize || 0}
                                  max={Math.min(
                                    shipSize / 2,
                                    spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.maxSize || 0
                                  )}
                                  step={spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.baseSize || 0}
                                  value={weaponSelections[hardpoint.id]?.weapons[0]?.tonnage || ''}
                                  onChange={e => {
                                    const baseSize = spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.baseSize || 0;
                                    const multiple = Math.round(Number(e.target.value) / baseSize);
                                    const tonnage = multiple * baseSize;
                                    const prev = weaponSelections[hardpoint.id] || { mountType: hardpoint.type, weapons: [{}], popUp: false };
                                    const newWeapons = [...prev.weapons];
                                    newWeapons[0] = { 
                                      ...newWeapons[0], 
                                      type: newWeapons[0].type,
                                      tonnage,
                                      multiple
                                    };
                                    setWeaponSelections({
                                      ...weaponSelections,
                                      [hardpoint.id]: { ...prev, mountType: hardpoint.type, weapons: newWeapons }
                                    });
                                  }}
                                  style={{ width: '100%', marginBottom: 4 }}
                                />
                                {weaponSelections[hardpoint.id]?.weapons[0]?.tonnage && (
                                  <div style={{ fontSize: 12, color: '#f58220', marginTop: 4 }}>
                                    Multiple: {weaponSelections[hardpoint.id]?.weapons[0]?.multiple || 1}x<br />
                                    Power: {spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.power || 0 * (weaponSelections[hardpoint.id]?.weapons[0]?.multiple || 1)}<br />
                                    Damage: {spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.damage || '0D'} × {weaponSelections[hardpoint.id]?.weapons[0]?.multiple || 1}<br />
                                    Cost: MCr{spinalMountWeapons.find(w => w.name === weaponSelections[hardpoint.id]?.weapons[0]?.type)?.cost || 0 * (weaponSelections[hardpoint.id]?.weapons[0]?.multiple || 1)}
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                        {/* Existing weapon selection UI for other mount types ... */}
                        {isFirmpoint && !isBarbette ? (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: weaponSelections[hardpoint.id]?.popUp || false
                                  }
                                });
                              }}
                              style={{ width: '100%', marginBottom: 4 }}
                            >
                              <option value="">—</option>
                              {turretWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                            {/* For firmpoint turret, only allow single */}
                            {isUpgradedToTurret && (
                              <div style={{ fontSize: 13, marginBottom: 4 }}>
                                Turret Mode: Single
                              </div>
                            )}
                          </>
                        ) : isBarbette ? (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Weapon:</div>
                            <select
                              value={weaponSelections[hardpoint.id]?.weapons[0]?.type || ''}
                              onChange={e => {
                                setWeaponSelections({
                                  ...weaponSelections,
                                  [hardpoint.id]: {
                                    mountType: hardpoint.type,
                                    weapons: [{ type: e.target.value }],
                                    popUp: weaponSelections[hardpoint.id]?.popUp || false
                                  }
                                });
                              }}
                              style={{ width: '100%' }}
                            >
                              <option value="">—</option>
                              {barbetteWeapons.map(w => (
                                <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                              ))}
                            </select>
                            {isFirmpoint && (
                              <div style={{ fontSize: 12, color: '#f58220', marginTop: 4 }}>
                                Barbette consumes 3 firmpoints and extra tonnage.
                              </div>
                            )}
                          </>
                        ) : (hardpoint.type === 'Fixed Mount' || hardpoint.type === 'Turret') ? (
                          <>
                            <div style={{ fontSize: 13, marginBottom: 4 }}>Weapons (up to 3):</div>
                            {[0,1,2].map(i => (
                              <div key={i} style={{ marginBottom: 4 }}>
                                <select
                                  value={weaponSelections[hardpoint.id]?.weapons[i]?.type || ''}
                                  onChange={e => {
                                    const prev = weaponSelections[hardpoint.id] || { mountType: hardpoint.type, weapons: [{}, {}, {}], popUp: false };
                                    const newWeapons = [...prev.weapons];
                                    newWeapons[i] = { type: e.target.value };
                                    setWeaponSelections({
                                      ...weaponSelections,
                                      [hardpoint.id]: { ...prev, mountType: hardpoint.type, weapons: newWeapons }
                                    });
                                  }}
                                  style={{ width: '100%' }}
                                >
                                  <option value="">—</option>
                                  {turretWeapons.map(w => (
                                    <option key={w.name} value={w.name}>{w.name} (TL{w.tl})</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </>
                        ) : null}
                        {/* Pop-Up Mounting: only for fixed mount/turret, and for firmpoint turret only if upgraded */}
                        {(hardpoint.type === 'Fixed Mount' || (hardpoint.type === 'Turret' && (!isFirmpoint || isUpgradedToTurret))) && (
                          <div style={{ marginTop: 6 }}>
                            <label>
                              <input
                                type="checkbox"
                                checked={weaponSelections[hardpoint.id]?.popUp || false}
                                onChange={e => {
                                  const prev = weaponSelections[hardpoint.id] || { mountType: hardpoint.type, weapons: isFirmpoint ? [{}] : [{}, {}, {}], popUp: false };
                                  setWeaponSelections({
                                    ...weaponSelections,
                                    [hardpoint.id]: { ...prev, popUp: e.target.checked }
                                  });
                                }}
                              />
                              Pop-Up Mounting
                            </label>
                          </div>
                        )}
                        {isFirmpoint && isUpgradedToTurret && (
                          <div style={{ fontSize: 12, color: '#f58220', marginTop: 4 }}>
                            Only a single turret (not double/triple) is allowed on a firmpoint.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '20px', 
        border: '1px solid #ccc', 
        padding: '20px',
        backgroundColor: '#f8f8f8',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        color: '#000000',
        display: 'flex',
        gap: '32px',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
      }}>
        {/* LEFT COLUMN: Main Table */}
        <div style={{ flex: 2, minWidth: 320 }}>
          <h3 style={{ color: '#000000', marginTop: 0, marginBottom: 16 }}>Ship Summary</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid #bbb' }}>Item</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid #bbb' }}>Details</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>TONS</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>COST (MCr)</th>
              </tr>
            </thead>
            <tbody>
              {/* Hull */}
              {selectedHull && (
                <>
                  <tr>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Hull</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.type}{selectedHull.specializedType ? `, ${selectedHull.specializedType}` : ''}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.size}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(selectedHull.cost).toFixed(1)}</td>
                  </tr>
                  {/* Armour */}
                  <tr>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Armour</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.armour.type}, Protection: {selectedHull.armour.protection}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.armour.protection * 5}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(selectedHull.armour.protection * 1.5).toFixed(1)}</td>
                  </tr>
                </>
              )}
              {/* Drives */}
              {selectedDrives.map((drive, idx) => {
                  let driveDesc = '';
                  if (drive.type === 'Manoeuvre') driveDesc = ' (Main propulsion)';
                  if (drive.type === 'Jump') driveDesc = ' (Interstellar travel)';
                  if (drive.type === 'Reaction') driveDesc = ' (Auxiliary/backup)';
                  return (
                    <tr key={drive.type + drive.rating}>
                      <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{drive.type}-Drive</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Rating {drive.rating}{driveDesc}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(shipSize * drive.percentOfHull / 100).toFixed(0)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{((shipSize * drive.percentOfHull / 100) * drive.costPerTon).toFixed(1)}</td>
                    </tr>
                  );
                })}
              {/* Power Plant */}
              {selectedPowerPlant && (
                <tr>
                  <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Power Plant</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{selectedPowerPlant.type} (TL{selectedPowerPlant.techLevel}) | {powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)} tons @ {selectedPowerPlant.powerPerTon} power/ton</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{selectedPowerPlant ? ((powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)) * selectedPowerPlant.costPerTon).toFixed(1) : '—'}</td>
                </tr>
              )}
              {/* Fuel Tanks */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Fuel Tanks</td>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {(() => {
                      let jumps = '';
                      let weeks = '';
                      const minJumpFuel = (selectedHull && selectedDrives.find(d => d.type === 'Jump')) ? ((selectedHull.size || 0) * 10 * (selectedDrives.find(d => d.type === 'Jump')?.rating || 1) / 100) : 0;
                      if (selectedDrives.find(d => d.type === 'Jump') && minJumpFuel > 0) {
                        jumps = (fuelRequirements.total / minJumpFuel).toFixed(1);
                      }
                      if (selectedPowerPlant && fuelRequirements.powerPlant > 0) {
                        weeks = (fuelRequirements.total / fuelRequirements.powerPlant * powerPlantWeeks).toFixed(1);
                      }
                      if (jumps && weeks) {
                        return <span>up to {parseFloat(jumps)} jumps and/or {parseFloat(weeks)} weeks of operation</span>;
                      } else if (jumps) {
                        return <span>up to {parseFloat(jumps)} jumps</span>;
                      } else if (weeks) {
                        return <span>up to {parseFloat(weeks)} weeks of operation</span>;
                      } else {
                        return null;
                      }
                    })()}
                  </div>
                </td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{fuelRequirements.total.toFixed(1)}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td>
              </tr>
              {/* Bridge */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Bridge</td>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{(() => {
                  if (bridgeType === 'standard') return 'Standard Bridge';
                  if (bridgeType === 'smaller') return 'Smaller Bridge (DM-1)';
                  if (bridgeType === 'command') return 'Command Bridge (DM+1 Tactics)';
                  if (bridgeType === 'cockpit') return 'Cockpit';
                  if (bridgeType === 'dualCockpit') return 'Dual Cockpit';
                  return 'Bridge';
                })()}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{bridgeSize}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{Number(bridgeCost.toFixed(3)) % 1 === 0 ? bridgeCost.toFixed(1) : bridgeCost.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}</td>
              </tr>
              {/* Computer */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Computer</td>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{primaryComputer}{primaryBis && ' (/bis)'}{primaryFib && ' (/fib)'}{backupEnabled && (<><br /><span style={{ fontSize: '12px', color: '#888' }}>Backup: {backupComputer}{backupBis && ' (/bis)'}{backupFib && ' (/fib)'}</span></>)}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(() => {
                  const cost = getComputerCost(primaryComputer, primaryBis, primaryFib) + (backupEnabled ? getComputerCost(backupComputer, backupBis, backupFib) : 0);
                  return Number(cost.toFixed(3)) % 1 === 0 ? cost.toFixed(1) : cost.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
                })()}</td>
              </tr>
              {/* Sensors */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Sensors</td>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{(() => {
                  const opt = sensorOptions.find(s => s.name === selectedSensor);
                  if (!opt) return 'Sensors';
                  return (<>{opt.name} (TL{opt.tl})<br /><span style={{ fontSize: '12px', color: '#888' }}>Suite: {opt.suite}, DM: {opt.dm > 0 ? '+' : ''}{opt.dm}, Power: {opt.power}, Tons: {opt.tons}</span></>);
                })()}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{sensorOptions.find(s => s.name === selectedSensor)?.tons || '—'}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{sensorOptions.find(s => s.name === selectedSensor)?.cost ? sensorOptions.find(s => s.name === selectedSensor)?.cost : '—'}</td>
              </tr>
              {/* Weapons & Defenses */}
              {hardpoints.length > 0 && (
                // Render a row for each assigned weapon mount or defensive system
                hardpoints.map((hp) => {
                  const sel = weaponSelections[hp.id];
                  // Defensive systems
                  if (["Screen", "Point Defense", "Black Globe"].includes(hp.type) && hp.weapon) {
                    let tons = 0, cost = 0;
                    let label = 'Defence';
                    let typeLabel = '';
                    if (hp.type === 'Screen') {
                      const screen = screens.find(s => s.name === hp.weapon);
                      if (screen) { tons = screen.tons; cost = screen.cost; typeLabel = 'Screen'; }
                    } else if (hp.type === 'Point Defense') {
                      const pd = pointDefenseWeapons.find(w => w.name === hp.weapon);
                      if (pd) { tons = pd.tons; cost = pd.cost; typeLabel = 'Point Defense'; }
                    } else if (hp.type === 'Black Globe') {
                      tons = blackGlobeGenerator.tons; cost = blackGlobeGenerator.cost; typeLabel = 'Black Globe';
                    }
                    return (
                      <tr key={hp.id}>
                        <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{label}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{typeLabel} — {hp.weapon}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{tons}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{cost}</td>
                      </tr>
                    );
                  }
                  // Weapons: group all weapons in this mount into a single row
                  if (sel && sel.weapons.some(w => w.type)) {
                    const weaponList = sel.weapons.filter(w => w.type).map(w => {
                      if (hp.type === 'Spinal Mount' && w.multiple) {
                        return `${w.type} (${w.multiple}x)`;
                      }
                      return w.type;
                    }).join(', ');
                    let totalCost = 0;
                    let totalTons = 0;
                    let typeLabel = hp.type + (sel.popUp ? ' (Pop-Up)' : '');
                    if (hp.type === 'Turret' || hp.type === 'Barbette' || hp.type === 'Fixed Mount') {
                      const mountStats = getMountStats(hp.type, sel.popUp || false, !!hp.isFirmpoint);
                      totalTons = mountStats.tons;
                      totalCost = sel.weapons.filter(w => w.type).reduce((sum, w) => {
                        let weapon = turretWeapons.find(x => x.name === w.type) || barbetteWeapons.find(x => x.name === w.type);
                        return sum + (weapon ? weapon.cost : 0);
                      }, 0);
                    } else if (hp.type === 'Small Bay') {
                      const bay = smallBayWeapons.find(x => x.name === sel.weapons[0]?.type);
                      totalTons = bay ? bay.tons : 0;
                      totalCost = bay ? bay.cost : 0;
                    } else if (hp.type === 'Medium Bay') {
                      const bay = mediumBayWeapons.find(x => x.name === sel.weapons[0]?.type);
                      totalTons = bay ? bay.tons : 0;
                      totalCost = bay ? bay.cost : 0;
                    } else if (hp.type === 'Large Bay') {
                      const bay = largeBayWeapons.find(x => x.name === sel.weapons[0]?.type);
                      totalTons = bay ? bay.tons : 0;
                      totalCost = bay ? bay.cost : 0;
                    } else if (hp.type === 'Spinal Mount' && sel.weapons[0]?.multiple) {
                      const spinal = spinalMountWeapons.find(x => x.name === sel.weapons[0]?.type);
                      totalTons = spinal && spinal.baseSize ? spinal.baseSize * (sel.weapons[0].multiple || 1) : 0;
                      totalCost = spinal ? spinal.cost * (sel.weapons[0].multiple || 1) : 0;
                    } else if (hp.type === 'Spinal Mount') {
                      const spinal = spinalMountWeapons.find(x => x.name === sel.weapons[0]?.type);
                      totalTons = spinal && spinal.baseSize ? spinal.baseSize : 0;
                      totalCost = spinal ? spinal.cost : 0;
                    }
                    return (
                      <tr key={hp.id}>
                        <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Weapon</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{typeLabel} — {weaponList}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{totalTons}</td>
                        <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{totalCost}</td>
                      </tr>
                    );
                  }
                  return null;
                })
              )}
              {/* Placeholders */}
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Systems</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Craft</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Software</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Staterooms</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Common Areas</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Cargo</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
            </tbody>
          </table>
        </div>
        {/* RIGHT COLUMN: Highlight Boxes */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Crew */}
          <div style={{ background: '#f58220', color: '#fff', padding: '12px 16px', borderRadius: 4, fontWeight: 600, fontSize: 18 }}>
            Crew:<br />
            <span style={{ fontWeight: 400, fontSize: 15 }}>Captain, Pilots x3, Astrogator, Engineers x4, Medic, Gunners x8, Administrator, Maintenance, Officer</span>
          </div>
          {/* Hull */}
          <div style={{ background: '#f58220', color: '#fff', padding: '12px 16px', borderRadius: 4, fontWeight: 600, fontSize: 18 }}>
            Hull:<br />
            <span style={{ fontWeight: 400, fontSize: 15 }}>{selectedHull ? selectedHull.hullPoints : '—'}</span>
          </div>
          {/* Running Costs */}
          <div style={{ background: '#f58220', color: '#fff', padding: '12px 16px', borderRadius: 4, fontWeight: 600, fontSize: 18 }}>
            Running Costs:<br />
            <span style={{ fontWeight: 400, fontSize: 15 }}>Maintenance: Cr20750/month<br />Purchase: MCr{stats.cost.toFixed(1)}</span>
          </div>
          {/* Power Requirements */}
          <div style={{ background: '#f58220', color: '#fff', padding: '12px 16px', borderRadius: 4, fontWeight: 600, fontSize: 18 }}>
            Power Requirements:<br />
            <span style={{ fontWeight: 400, fontSize: 15 }}>
              Basic Ship Systems: {stats.powerRequired.basicSystems}<br />
              Manoeuvre Drive: {stats.powerRequired.manoeuvre}<br />
              Jump Drive: {stats.powerRequired.jump}<br />
              Sensors: 2<br />
              Weapons: {(() => { 
                let totalPower = 0; 
                hardpoints.forEach(hp => { 
                  const sel = weaponSelections[hp.id]; 
                  if (!sel || !sel.weapons.some(w => w.type)) return; 
                  const isFirmpoint = !!hp.isFirmpoint; 
                  sel.weapons.forEach(w => { 
                    let weapon = turretWeapons.find(x => x.name === w.type) || 
                               barbetteWeapons.find(x => x.name === w.type) ||
                               spinalMountWeapons.find(x => x.name === w.type);
                    if (!weapon && hp.type === 'Small Bay') weapon = smallBayWeapons.find(x => x.name === w.type); 
                    if (!weapon && hp.type === 'Medium Bay') weapon = mediumBayWeapons.find(x => x.name === w.type); 
                    if (!weapon && hp.type === 'Large Bay') weapon = largeBayWeapons.find(x => x.name === w.type); 
                    if (!weapon) return; 
                    let power = weapon.power || 0; 
                    if (isFirmpoint) power = Math.ceil(power * 0.75);
                    if (hp.type === 'Spinal Mount' && w.multiple) {
                      power *= w.multiple;
                    }
                    totalPower += power; 
                  }); 
                }); 
                return totalPower > 0 ? totalPower : '—'; 
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
