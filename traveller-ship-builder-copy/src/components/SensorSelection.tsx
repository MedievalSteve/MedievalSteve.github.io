import React from 'react';

interface SensorSelectionProps {
  shipSize: number;
  onSensorTonnageChange: (tonnage: number) => void;
}

const SensorSelection: React.FC<SensorSelectionProps> = ({
  shipSize,
  onSensorTonnageChange
}) => {
  const calculateSensorTonnage = (size: number): number => {
    if (size <= 100) return 1;
    if (size <= 200) return 2;
    if (size <= 500) return 3;
    if (size <= 1000) return 4;
    if (size <= 2000) return 5;
    if (size <= 5000) return 6;
    if (size <= 10000) return 7;
    if (size <= 20000) return 8;
    if (size <= 50000) return 9;
    if (size <= 100000) return 10;
    return 11; // For ships over 100,000 tons
  };

  const sensorTonnage = calculateSensorTonnage(shipSize);
  const sensorCost = sensorTonnage * 2; // 2 MCr per ton

  return (
    <div>
      <h2>Sensor Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Sensor Requirements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label>
              Sensor Size (tons):
              <input
                type="number"
                min={sensorTonnage}
                value={sensorTonnage}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
            <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>
              (Minimum required for {shipSize} ton ship)
            </span>
          </div>
          <div>
            <label>
              Sensor Cost (MCr):
              <input
                type="number"
                value={sensorCost}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <h4>Sensor Features</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• Active Sensors</li>
              <li>• Passive Sensors</li>
              <li>• Navigational Sensors</li>
              <li>• Targeting Systems</li>
              <li>• Communications Array</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorSelection; 