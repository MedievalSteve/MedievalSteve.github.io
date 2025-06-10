import React from 'react';

interface ComputerSelectionProps {
  shipSize: number;
  onComputerTonnageChange: (tonnage: number) => void;
}

const ComputerSelection: React.FC<ComputerSelectionProps> = ({
  shipSize,
  onComputerTonnageChange
}) => {
  const calculateComputerTonnage = (size: number): number => {
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

  const computerTonnage = calculateComputerTonnage(shipSize);
  const computerCost = computerTonnage * 2; // 2 MCr per ton

  return (
    <div>
      <h2>Computer Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Computer Requirements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label>
              Computer Size (tons):
              <input
                type="number"
                min={computerTonnage}
                value={computerTonnage}
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
              Computer Cost (MCr):
              <input
                type="number"
                value={computerCost}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <h4>Computer Features</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• Navigation Control</li>
              <li>• Jump Control</li>
              <li>• Maneuver Control</li>
              <li>• Sensor Integration</li>
              <li>• Weapon Control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComputerSelection; 