import React from 'react';

interface Weapon {
  name: string;
  tonnage: number;
  cost: number;
  damage: string;
  range: string;
  type: 'Turret' | 'Bay' | 'Barbette';
}

interface WeaponSelectionProps {
  shipSize: number;
  onWeaponTonnageChange: (tonnage: number) => void;
}

const WeaponSelection: React.FC<WeaponSelectionProps> = ({
  shipSize,
  onWeaponTonnageChange
}) => {
  const availableWeapons: Weapon[] = [
    {
      name: 'Pulse Laser',
      tonnage: 1,
      cost: 0.5,
      damage: '1D',
      range: 'Short',
      type: 'Turret'
    },
    {
      name: 'Beam Laser',
      tonnage: 1,
      cost: 1,
      damage: '2D',
      range: 'Medium',
      type: 'Turret'
    },
    {
      name: 'Particle Accelerator',
      tonnage: 1,
      cost: 2,
      damage: '3D',
      range: 'Long',
      type: 'Turret'
    },
    {
      name: 'Missile Rack',
      tonnage: 1,
      cost: 0.75,
      damage: '2D',
      range: 'Long',
      type: 'Turret'
    },
    {
      name: 'Fusion Gun',
      tonnage: 10,
      cost: 10,
      damage: '4D',
      range: 'Medium',
      type: 'Bay'
    },
    {
      name: 'Meson Gun',
      tonnage: 50,
      cost: 50,
      damage: '5D',
      range: 'Long',
      type: 'Bay'
    }
  ];

  const [selectedWeapons, setSelectedWeapons] = React.useState<Weapon[]>([]);
  const [totalTonnage, setTotalTonnage] = React.useState(0);
  const [totalCost, setTotalCost] = React.useState(0);

  const handleWeaponToggle = (weapon: Weapon) => {
    const newSelectedWeapons = selectedWeapons.includes(weapon)
      ? selectedWeapons.filter(w => w !== weapon)
      : [...selectedWeapons, weapon];

    setSelectedWeapons(newSelectedWeapons);
    
    const newTotalTonnage = newSelectedWeapons.reduce((sum, w) => sum + w.tonnage, 0);
    const newTotalCost = newSelectedWeapons.reduce((sum, w) => sum + w.cost, 0);
    
    setTotalTonnage(newTotalTonnage);
    setTotalCost(newTotalCost);
    onWeaponTonnageChange(newTotalTonnage);
  };

  return (
    <div>
      <h2>Weapon Selection</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Available Weapons</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {availableWeapons.map((weapon) => (
            <div key={weapon.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                checked={selectedWeapons.includes(weapon)}
                onChange={() => handleWeaponToggle(weapon)}
              />
              <div style={{ flex: 1 }}>
                <strong>{weapon.name}</strong>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Type: {weapon.type} | Tonnage: {weapon.tonnage} | Cost: {weapon.cost} MCr
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Damage: {weapon.damage} | Range: {weapon.range}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Selected Weapons Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label>
                Total Weapon Tonnage:
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
                Total Weapon Cost (MCr):
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

export default WeaponSelection; 