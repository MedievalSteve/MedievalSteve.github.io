import React from 'react';
import type { PowerPlant } from '../types';

interface PowerPlantSelectionProps {
  selectedPowerPlant: PowerPlant | null;
  setSelectedPowerPlant: (plant: PowerPlant | null) => void;
  techLevel: number;
  shipSize: number;
}

const PowerPlantSelection: React.FC<PowerPlantSelectionProps> = ({
  selectedPowerPlant,
  setSelectedPowerPlant,
  techLevel,
  shipSize
}) => {
  const powerPlantTypes: Array<PowerPlant> = [
    { type: 'Fission', techLevel: 7, powerPerTon: 1, costPerTon: 0.5, canPowerJump: false },
    { type: 'Chemical', techLevel: 7, powerPerTon: 2, costPerTon: 0.5, canPowerJump: false },
    { type: 'Fusion', techLevel: 8, powerPerTon: 4, costPerTon: 1, canPowerJump: true },
    { type: 'Antimatter', techLevel: 12, powerPerTon: 8, costPerTon: 2, canPowerJump: true }
  ];

  const handlePowerPlantChange = (field: keyof PowerPlant, value: any) => {
    if (selectedPowerPlant) {
      setSelectedPowerPlant({
        ...selectedPowerPlant,
        [field]: value
      });
    }
  };

  return (
    <div>
      <h2>Power Plant Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Power Plant Type:
          <select
            value={selectedPowerPlant?.type || ''}
            onChange={(e) => {
              const type = e.target.value as PowerPlant['type'];
              const plant = powerPlantTypes.find(p => p.type === type);
              if (plant) {
                setSelectedPowerPlant(plant);
              }
            }}
          >
            <option value="">Select a power plant</option>
            {powerPlantTypes.map((plant) => (
              <option key={plant.type} value={plant.type} disabled={plant.techLevel > techLevel}>
                {plant.type} (TL{plant.techLevel})
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedPowerPlant && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Power Plant Size (tons):
              <input
                type="number"
                min="1"
                value={Math.ceil(shipSize * 0.01)} // Default to 1% of hull
                onChange={(e) => handlePowerPlantChange('powerPerTon', Number(e.target.value))}
                disabled={techLevel < selectedPowerPlant.techLevel}
              />
            </label>
          </div>

          <div>
            <p>Power Output: {selectedPowerPlant.powerPerTon * Math.ceil(shipSize * 0.01)} MW</p>
            <p>Cost: {selectedPowerPlant.costPerTon * Math.ceil(shipSize * 0.01)} MCr</p>
            <p>Can Power Jump Drive: {selectedPowerPlant.canPowerJump ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerPlantSelection; 