export interface Hull {
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

export interface Drive {
  type: 'Manoeuvre' | 'Jump' | 'Reaction';
  rating: number;
  percentOfHull: number;
  minTechLevel: number;
  costPerTon: number;
  requiresPower: boolean;
}

export interface PowerPlant {
  type: 'Fission' | 'Chemical' | 'Fusion' | 'Antimatter';
  techLevel: number;
  powerPerTon: number;
  costPerTon: number;
  canPowerJump: boolean;
}

export interface ShipStats {
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

export interface FuelRequirements {
  reactionDrive: number;  // tons
  jumpDrive: number;      // tons
  powerPlant: number;     // tons
  total: number;          // tons
}

export interface HullOption {
  cost: number;
  techLevel: number;
  description: string;
}

export interface StealthOption extends HullOption {
  types: {
    [key: string]: {
      cost: number;
      techLevel: number;
      dm: number;
      tonnage: number;
    };
  };
}

export interface Hardpoint {
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

export interface CrewRequirements {
  captain: number;
  pilots: number;
  astrogators: number;
  engineers: number;
  maintenance: number;
  gunners: number;
  steward: number;
  administrators: number;
  sensorOperators: number;
  medics: number;
  officers: number;
  total: number;
} 