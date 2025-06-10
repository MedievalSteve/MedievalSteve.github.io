import React from 'react';
import type { Drive, PowerPlant, FuelRequirements } from '../types';

interface FuelRequirementsProps {
  selectedDrives: Drive[];
  selectedPowerPlant: PowerPlant | null;
  shipSize: number;
}

const FuelRequirements: React.FC<FuelRequirementsProps> = ({
  selectedDrives,
  selectedPowerPlant,
  shipSize
}) => {
  const calculateFuelRequirements = (): FuelRequirements => {
    const requirements: FuelRequirements = {
      reactionDrive: 0,
      jumpDrive: 0,
      powerPlant: 0,
      total: 0
    };

    // Calculate fuel for each drive
    selectedDrives.forEach(drive => {
      const driveTonnage = Math.ceil(shipSize * (drive.percentOfHull / 100));
      
      switch (drive.type) {
        case 'Reaction':
          requirements.reactionDrive = driveTonnage * 0.1; // 10% of drive tonnage
          break;
        case 'Jump':
          requirements.jumpDrive = driveTonnage * drive.rating; // 1 ton per jump rating
          break;
      }
    });

    // Calculate power plant fuel
    if (selectedPowerPlant) {
      const powerPlantTonnage = Math.ceil(shipSize * 0.01); // 1% of hull
      requirements.powerPlant = powerPlantTonnage * 0.1; // 10% of power plant tonnage
    }

    // Calculate total
    requirements.total = requirements.reactionDrive + requirements.jumpDrive + requirements.powerPlant;

    return requirements;
  };

  const fuelRequirements = calculateFuelRequirements();

  return (
    <div>
      <h2>Fuel Requirements</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Fuel Tanks</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label>
              Reaction Drive Fuel (tons):
              <input
                type="number"
                min="0"
                value={fuelRequirements.reactionDrive}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div>
            <label>
              Jump Drive Fuel (tons):
              <input
                type="number"
                min="0"
                value={fuelRequirements.jumpDrive}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div>
            <label>
              Power Plant Fuel (tons):
              <input
                type="number"
                min="0"
                value={fuelRequirements.powerPlant}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div>
            <label>
              Total Fuel Required (tons):
              <input
                type="number"
                min="0"
                value={fuelRequirements.total}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelRequirements; 