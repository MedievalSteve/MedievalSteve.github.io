import React from 'react';
import { Hull } from '../types';

interface HullSelectionProps {
  selectedHull: Hull | null;
  setSelectedHull: (hull: Hull | null) => void;
  techLevel: number;
  shipSize: number;
  setShipSize: (size: number) => void;
}

const HullSelection: React.FC<HullSelectionProps> = ({
  selectedHull,
  setSelectedHull,
  techLevel,
  shipSize,
  setShipSize
}) => {
  const hullTypes = [
    { type: 'Standard', minTechLevel: 12 },
    { type: 'Streamlined', minTechLevel: 12 },
    { type: 'Sphere', minTechLevel: 12 },
    { type: 'Close Structure', minTechLevel: 12 },
    { type: 'Dispersed Structure', minTechLevel: 12 },
    { type: 'Planetoid', minTechLevel: 12 },
    { type: 'Buffered Planetoid', minTechLevel: 12 }
  ];

  const specializedTypes = [
    { type: 'Reinforced', minTechLevel: 12 },
    { type: 'Light', minTechLevel: 12 },
    { type: 'Military', minTechLevel: 12 },
    { type: 'Non-Gravity', minTechLevel: 12 }
  ];

  const additionalTypes = [
    { type: 'Double Hull', minTechLevel: 12 },
    { type: 'Hamster Cage', minTechLevel: 12 },
    { type: 'Breakaway Hulls', minTechLevel: 12 }
  ];

  return (
    <div>
      <h2>Hull Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Ship Size (tons):
          <input
            type="number"
            min="100"
            max="1000000"
            step="100"
            value={shipSize}
            onChange={(e) => setShipSize(Number(e.target.value))}
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Hull Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {hullTypes.map(({ type, minTechLevel }) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="hullType"
                value={type}
                checked={selectedHull?.type === type}
                onChange={() => {
                  if (selectedHull) {
                    setSelectedHull({
                      ...selectedHull,
                      type: type as Hull['type']
                    });
                  }
                }}
                disabled={techLevel < minTechLevel}
              />
              <span>{type} (TL{minTechLevel})</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Specialized Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {specializedTypes.map(({ type, minTechLevel }) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="specializedType"
                value={type}
                checked={selectedHull?.specializedType === type}
                onChange={() => {
                  if (selectedHull) {
                    setSelectedHull({
                      ...selectedHull,
                      specializedType: type as Hull['specializedType']
                    });
                  }
                }}
                disabled={techLevel < minTechLevel}
              />
              <span>{type} (TL{minTechLevel})</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Additional Type</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {additionalTypes.map(({ type, minTechLevel }) => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="radio"
                name="additionalType"
                value={type}
                checked={selectedHull?.additionalType === type}
                onChange={() => {
                  if (selectedHull) {
                    setSelectedHull({
                      ...selectedHull,
                      additionalType: type as Hull['additionalType']
                    });
                  }
                }}
                disabled={techLevel < minTechLevel}
              />
              <span>{type} (TL{minTechLevel})</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Hull Options</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedHull?.options.heatShielding}
              onChange={(e) => {
                if (selectedHull) {
                  setSelectedHull({
                    ...selectedHull,
                    options: {
                      ...selectedHull.options,
                      heatShielding: e.target.checked
                    }
                  });
                }
              }}
            />
            <span>Heat Shielding</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedHull?.options.radiationShielding}
              onChange={(e) => {
                if (selectedHull) {
                  setSelectedHull({
                    ...selectedHull,
                    options: {
                      ...selectedHull.options,
                      radiationShielding: e.target.checked
                    }
                  });
                }
              }}
            />
            <span>Radiation Shielding</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedHull?.options.reflec}
              onChange={(e) => {
                if (selectedHull) {
                  setSelectedHull({
                    ...selectedHull,
                    options: {
                      ...selectedHull.options,
                      reflec: e.target.checked
                    }
                  });
                }
              }}
            />
            <span>Reflec</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selectedHull?.options.solarCoating}
              onChange={(e) => {
                if (selectedHull) {
                  setSelectedHull({
                    ...selectedHull,
                    options: {
                      ...selectedHull.options,
                      solarCoating: e.target.checked
                    }
                  });
                }
              }}
            />
            <span>Solar Coating</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default HullSelection; 