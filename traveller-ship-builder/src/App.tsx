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

    return {
      tonnage: shipSize,
      cost: hullCost + drivesCost + powerPlantCost,
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
                <th style={{ textAlign: 'left', padding: '6px 8px', border: '1px solid #bbb' }}>TL{stats.techLevel}</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>TONS</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>COST (MCr)</th>
              </tr>
            </thead>
            <tbody>
              {/* Hull */}
              {selectedHull && (
                <>
                  <tr>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Hull{selectedHull.specializedType ? `, ${selectedHull.specializedType}` : ''}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.size}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(selectedHull.cost).toFixed(1)}</td>
                  </tr>
                  {/* Armour */}
                  <tr>
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{selectedHull.armour.type}, Armour: {selectedHull.armour.protection}</td>
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
                    <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>{drive.type}-Drive {drive.rating}{driveDesc}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{(shipSize * drive.percentOfHull / 100).toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{((shipSize * drive.percentOfHull / 100) * drive.costPerTon).toFixed(1)}</td>
                  </tr>
                );
              })}
              {/* Power Plant */}
              {selectedPowerPlant && (
                <tr>
                  <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>
                    Power Plant: {selectedPowerPlant.type} (TL{selectedPowerPlant.techLevel}) | {powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)} tons @ {selectedPowerPlant.powerPerTon} power/ton
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>
                    {powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>
                    {selectedPowerPlant ? ((powerPlantTons !== null ? powerPlantTons : getRecommendedPowerPlantTons(selectedPowerPlant)) * selectedPowerPlant.costPerTon).toFixed(1) : '—'}
                  </td>
                </tr>
              )}
              {/* Fuel Tanks */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>
                  Fuel Tanks
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
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>
                  {(() => {
                    if (bridgeType === 'standard') return 'Standard Bridge';
                    if (bridgeType === 'smaller') return 'Smaller Bridge (DM-1)';
                    if (bridgeType === 'command') return 'Command Bridge (DM+1 Tactics)';
                    if (bridgeType === 'cockpit') return 'Cockpit';
                    if (bridgeType === 'dualCockpit') return 'Dual Cockpit';
                    return 'Bridge';
                  })()}
                </td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{bridgeSize}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{bridgeCost.toFixed(3)}</td>
              </tr>
              {/* Computer */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>
                  {primaryComputer}
                  {primaryBis && ' (/bis)'}
                  {primaryFib && ' (/fib)'}
                  {backupEnabled && (
                    <><br /><span style={{ fontSize: '12px', color: '#888' }}>Backup: {backupComputer}{backupBis && ' (/bis)'}{backupFib && ' (/fib)'}</span></>
                  )}
                </td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>{
                  (getComputerCost(primaryComputer, primaryBis, primaryFib) + (backupEnabled ? getComputerCost(backupComputer, backupBis, backupFib) : 0)).toFixed(3)
                }</td>
              </tr>
              {/* Sensors */}
              <tr>
                <td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Sensors</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>2</td>
                <td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>4.1</td>
              </tr>
              {/* Weapons, Systems, Craft, Software, Staterooms, Common Areas, Cargo */}
              {/* Placeholders for now, can be filled with real data if available */}
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Weapons</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Systems</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Craft</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Software</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Staterooms</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Common Areas</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
              <tr><td style={{ padding: '6px 8px', border: '1px solid #bbb' }}>Cargo</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td><td style={{ textAlign: 'right', padding: '6px 8px', border: '1px solid #bbb' }}>—</td></tr>
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
              Sensors: 2
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
