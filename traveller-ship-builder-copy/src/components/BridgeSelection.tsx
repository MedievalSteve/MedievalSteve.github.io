import React from 'react';

interface BridgeSelectionProps {
  shipSize: number;
  onBridgeTonnageChange: (tonnage: number) => void;
}

const BridgeSelection: React.FC<BridgeSelectionProps> = ({
  shipSize,
  onBridgeTonnageChange
}) => {
  const calculateBridgeTonnage = (size: number): number => {
    if (size <= 100) return 20;
    if (size <= 200) return 40;
    if (size <= 500) return 60;
    if (size <= 1000) return 80;
    if (size <= 2000) return 100;
    if (size <= 5000) return 120;
    if (size <= 10000) return 140;
    if (size <= 20000) return 160;
    if (size <= 50000) return 180;
    if (size <= 100000) return 200;
    return 220; // For ships over 100,000 tons
  };

  const bridgeTonnage = calculateBridgeTonnage(shipSize);
  const bridgeCost = bridgeTonnage * 0.5; // 0.5 MCr per ton

  return (
    <div>
      <h2>Bridge Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Bridge Requirements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label>
              Bridge Size (tons):
              <input
                type="number"
                min={bridgeTonnage}
                value={bridgeTonnage}
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
              Bridge Cost (MCr):
              <input
                type="number"
                value={bridgeCost}
                readOnly
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <h4>Bridge Features</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• Command and Control Center</li>
              <li>• Navigation Station</li>
              <li>• Communications Array</li>
              <li>• Sensor Operations</li>
              <li>• Engineering Control</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BridgeSelection; 