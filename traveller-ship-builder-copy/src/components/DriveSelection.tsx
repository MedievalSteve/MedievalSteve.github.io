import React from 'react';
import type { Drive } from '../types';

interface DriveSelectionProps {
  selectedDrives: Drive[];
  setSelectedDrives: (drives: Drive[]) => void;
  techLevel: number;
  shipSize: number;
}

const DriveSelection: React.FC<DriveSelectionProps> = ({
  selectedDrives,
  setSelectedDrives,
  techLevel,
  shipSize
}) => {
  const driveTypes = [
    { type: 'Manoeuvre', minTechLevel: 7 },
    { type: 'Jump', minTechLevel: 7 },
    { type: 'Reaction', minTechLevel: 7 }
  ];

  const handleDriveChange = (index: number, field: keyof Drive, value: any) => {
    const newDrives = [...selectedDrives];
    newDrives[index] = {
      ...newDrives[index],
      [field]: value
    };
    setSelectedDrives(newDrives);
  };

  const addDrive = () => {
    if (selectedDrives.length < 3) {
      setSelectedDrives([
        ...selectedDrives,
        {
          type: 'Manoeuvre',
          rating: 1,
          percentOfHull: 1,
          minTechLevel: 7,
          costPerTon: 0.5,
          requiresPower: true
        }
      ]);
    }
  };

  const removeDrive = (index: number) => {
    const newDrives = selectedDrives.filter((_, i) => i !== index);
    setSelectedDrives(newDrives);
  };

  return (
    <div>
      <h2>Drive Selection</h2>
      {selectedDrives.map((drive, index) => (
        <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3>Drive {index + 1}</h3>
            <button onClick={() => removeDrive(index)}>Remove</button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              Drive Type:
              <select
                value={drive.type}
                onChange={(e) => handleDriveChange(index, 'type', e.target.value)}
                disabled={techLevel < drive.minTechLevel}
              >
                {driveTypes.map(({ type, minTechLevel }) => (
                  <option key={type} value={type} disabled={techLevel < minTechLevel}>
                    {type} (TL{minTechLevel})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Rating:
              <input
                type="number"
                min="1"
                max="6"
                value={drive.rating}
                onChange={(e) => handleDriveChange(index, 'rating', Number(e.target.value))}
                disabled={techLevel < drive.minTechLevel}
              />
            </label>
          </div>

          <div>
            <p>Percent of Hull: {drive.percentOfHull}%</p>
            <p>Tonnage: {Math.ceil(shipSize * (drive.percentOfHull / 100))} tons</p>
            <p>Cost: {Math.ceil(shipSize * (drive.percentOfHull / 100) * drive.costPerTon)} MCr</p>
          </div>
        </div>
      ))}

      {selectedDrives.length < 3 && (
        <button onClick={addDrive}>Add Drive</button>
      )}
    </div>
  );
};

export default DriveSelection; 