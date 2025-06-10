import React from 'react';

interface OptionalSystem {
  name: string;
  tonnage: number;
  cost: number;
  description: string;
  category: 'Defensive' | 'Offensive' | 'Utility' | 'Cargo' | 'Passenger';
}

interface OptionalSystemsProps {
  shipSize: number;
  onSystemTonnageChange: (tonnage: number) => void;
}

const OptionalSystems: React.FC<OptionalSystemsProps> = ({
  shipSize,
  onSystemTonnageChange
}) => {
  const availableSystems: OptionalSystem[] = [
    {
      name: 'Escape Pods',
      tonnage: Math.ceil(shipSize * 0.01), // 1% of ship size
      cost: 0.1,
      description: 'Emergency escape pods for crew evacuation',
      category: 'Utility'
    },
    {
      name: 'Cargo Hold',
      tonnage: Math.ceil(shipSize * 0.1), // 10% of ship size
      cost: 0.1,
      description: 'Additional cargo storage space',
      category: 'Cargo'
    },
    {
      name: 'Passenger Berths',
      tonnage: Math.ceil(shipSize * 0.05), // 5% of ship size
      cost: 0.2,
      description: 'Comfortable passenger accommodations',
      category: 'Passenger'
    },
    {
      name: 'Fuel Scoops',
      tonnage: 1,
      cost: 1,
      description: 'Allows collection of unrefined fuel from gas giants',
      category: 'Utility'
    },
    {
      name: 'Repair Drones',
      tonnage: 2,
      cost: 2,
      description: 'Automated repair systems for hull damage',
      category: 'Utility'
    },
    {
      name: 'Advanced Sensors',
      tonnage: 1,
      cost: 2,
      description: 'Enhanced sensor capabilities',
      category: 'Utility'
    },
    {
      name: 'Point Defense System',
      tonnage: 1,
      cost: 1,
      description: 'Automated defense against incoming missiles',
      category: 'Defensive'
    },
    {
      name: 'Electronic Warfare Suite',
      tonnage: 2,
      cost: 3,
      description: 'Advanced electronic warfare capabilities',
      category: 'Offensive'
    }
  ];

  const [selectedSystems, setSelectedSystems] = React.useState<OptionalSystem[]>([]);
  const [totalTonnage, setTotalTonnage] = React.useState(0);
  const [totalCost, setTotalCost] = React.useState(0);

  const handleSystemToggle = (system: OptionalSystem) => {
    const newSelectedSystems = selectedSystems.includes(system)
      ? selectedSystems.filter(s => s !== system)
      : [...selectedSystems, system];

    setSelectedSystems(newSelectedSystems);
    
    const newTotalTonnage = newSelectedSystems.reduce((sum, s) => sum + s.tonnage, 0);
    const newTotalCost = newSelectedSystems.reduce((sum, s) => sum + s.cost, 0);
    
    setTotalTonnage(newTotalTonnage);
    setTotalCost(newTotalCost);
    onSystemTonnageChange(newTotalTonnage);
  };

  const groupedSystems = availableSystems.reduce((acc, system) => {
    if (!acc[system.category]) {
      acc[system.category] = [];
    }
    acc[system.category].push(system);
    return acc;
  }, {} as Record<string, OptionalSystem[]>);

  return (
    <div>
      <h2>Optional Systems</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Available Systems</h3>
        {Object.entries(groupedSystems).map(([category, systems]) => (
          <div key={category} style={{ marginBottom: '20px' }}>
            <h4>{category}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {systems.map((system) => (
                <div key={system.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={selectedSystems.includes(system)}
                    onChange={() => handleSystemToggle(system)}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{system.name}</strong>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Tonnage: {system.tonnage} | Cost: {system.cost} MCr
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {system.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: '20px' }}>
          <h3>Selected Systems Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label>
                Total System Tonnage:
                <input
                  type="number"
                  value={totalTonnage}
                  readOnly
                  style={{ marginLeft: 8, width: 100 }}
                />
              </label>
            </div>
            <div>
              <label>
                Total System Cost (MCr):
                <input
                  type="number"
                  value={totalCost}
                  readOnly
                  style={{ marginLeft: 8, width: 100 }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionalSystems; 