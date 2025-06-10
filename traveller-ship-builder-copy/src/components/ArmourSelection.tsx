import React from 'react';
import type { Hull } from '../types';

interface ArmourSelectionProps {
  selectedHull: Hull | null;
  setSelectedHull: (hull: Hull | null) => void;
  techLevel: number;
}

const ArmourSelection: React.FC<ArmourSelectionProps> = ({
  selectedHull,
  setSelectedHull,
  techLevel
}) => {
  const armourTypes = {
    'Titanium Steel': {
      techLevel: 7,
      maxProtection: (tl: number) => Math.min(6, tl - 6)
    },
    'Crystaliron': {
      techLevel: 8,
      maxProtection: (tl: number) => Math.min(8, tl - 7)
    },
    'Bonded Superdense': {
      techLevel: 9,
      maxProtection: (tl: number) => Math.min(10, tl - 8)
    },
    'Molecular Bonded': {
      techLevel: 10,
      maxProtection: (tl: number) => Math.min(12, tl - 9)
    }
  };

  return (
    <div>
      <h2>Armour Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Armour Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(armourTypes).map(([type, details]) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="armourType"
                value={type}
                checked={selectedHull?.armour.type === type}
                onChange={() => {
                  if (selectedHull) {
                    setSelectedHull({
                      ...selectedHull,
                      armour: {
                        ...selectedHull.armour,
                        type: type as Hull['armour']['type']
                      }
                    });
                  }
                }}
                disabled={techLevel < details.techLevel}
              />
              <span>{type} (TL{details.techLevel})</span>
              {type === 'Molecular Bonded' && (
                <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
                  Provides additional protection from Tachyon weapons.
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {selectedHull && (
        <div style={{ marginTop: '12px' }}>
          <label>
            Protection Level:
            <input
              type="number"
              min={0}
              max={(() => {
                if (!selectedHull) return 0;
                const details = armourTypes[selectedHull.armour.type];
                return details.maxProtection(techLevel);
              })()}
              value={selectedHull.armour.protection}
              onChange={e => {
                if (selectedHull) {
                  setSelectedHull({
                    ...selectedHull,
                    armour: {
                      ...selectedHull.armour,
                      protection: Math.max(0, Math.min(Number(e.target.value), armourTypes[selectedHull.armour.type].maxProtection(techLevel)))
                    }
                  });
                }
              }}
              style={{ marginLeft: 8, width: 60 }}
            />
            <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
              (max {selectedHull ? armourTypes[selectedHull.armour.type].maxProtection(techLevel) : 0})
            </span>
          </label>
        </div>
      )}
    </div>
  );
};

export default ArmourSelection; 