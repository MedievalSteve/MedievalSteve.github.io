import React from 'react';

interface CrewMember {
  role: string;
  skill: string;
  count: number;
  description: string;
  isOptional: boolean;
  isRequired: boolean;
  suggestedCount: number;
}

interface CrewRequirementsProps {
  shipSize: number;
  hasJumpDrive: boolean;
  hasWeapons: boolean;
  isMilitary: boolean;
  driveAndPowerPlantTons: number;
  onCrewCountChange: (crewComposition: {[key: string]: number}) => void;
  initialCrewComposition: {[key: string]: number};
}

const CrewRequirements: React.FC<CrewRequirementsProps> = ({
  shipSize,
  hasJumpDrive,
  hasWeapons,
  isMilitary,
  driveAndPowerPlantTons,
  onCrewCountChange,
  initialCrewComposition
}) => {
  const [crewMembers, setCrewMembers] = React.useState<CrewMember[]>([]);
  const [manualOverrides, setManualOverrides] = React.useState<{[key: string]: number}>({});
  const [crewType, setCrewType] = React.useState<'Commercial' | 'Military'>(isMilitary ? 'Military' : 'Commercial');

  React.useEffect(() => {
    // Calculate total crew first (excluding officers and medics)
    const calculateBaseCrew = () => {
      const baseCrew = [
        {
          role: 'captain',
          skill: 'Leadership',
          count: 1,
          description: 'Usually the leading officer',
          isOptional: false,
          isRequired: true,
          suggestedCount: 1
        },
        {
          role: 'pilot',
          skill: 'Pilot',
          count: 1,
          description: 'Controls the ship during normal space operations',
          isOptional: false,
          isRequired: true,
          suggestedCount: crewType === 'Military' ? 3 : 1
        },
        {
          role: 'astrogator',
          skill: 'Astrogation',
          count: hasJumpDrive ? 1 : 0,
          description: 'Plots courses and handles astrogation',
          isOptional: false,
          isRequired: hasJumpDrive,
          suggestedCount: hasJumpDrive ? 1 : 0
        },
        {
          role: 'engineer',
          skill: 'Engineering',
          count: Math.max(1, Math.ceil((driveAndPowerPlantTons || 0) / 35)),
          description: 'Maintains and operates ship systems',
          isOptional: false,
          isRequired: true,
          suggestedCount: Math.max(1, Math.ceil((driveAndPowerPlantTons || 0) / 35))
        },
        {
          role: 'maintenance',
          skill: 'Mechanic',
          count: Math.ceil(shipSize / (crewType === 'Military' ? 500 : 1000)),
          description: 'Performs routine maintenance and repairs',
          isOptional: true,
          isRequired: false,
          suggestedCount: Math.ceil(shipSize / (crewType === 'Military' ? 500 : 1000))
        },
        {
          role: 'gunner',
          skill: 'Gunnery',
          count: hasWeapons ? (crewType === 'Military' ? 2 : 1) : 0,
          description: 'Operates ship weapons systems',
          isOptional: false,
          isRequired: hasWeapons,
          suggestedCount: hasWeapons ? (crewType === 'Military' ? 2 : 1) : 0
        },
        {
          role: 'steward',
          skill: 'Steward',
          count: Math.floor(shipSize / 1000), // 1 per 10 High or 100 Middle passengers
          description: 'Manages ship amenities and passenger services',
          isOptional: true,
          isRequired: false,
          suggestedCount: Math.floor(shipSize / 1000)
        },
        {
          role: 'administrator',
          skill: 'Admin',
          count: Math.floor(shipSize / (crewType === 'Military' ? 1000 : 2000)), // 1 per 1000/2000 tons
          description: 'Handles ship administration and paperwork',
          isOptional: true,
          isRequired: false,
          suggestedCount: Math.floor(shipSize / (crewType === 'Military' ? 1000 : 2000))
        },
        {
          role: 'sensorOperator',
          skill: 'Electronics (sensors)',
          count: Math.ceil(shipSize / 7500) * (crewType === 'Military' ? 3 : 1),
          description: 'Operates ship sensors and electronic systems',
          isOptional: true,
          isRequired: false,
          suggestedCount: Math.ceil(shipSize / 7500) * (crewType === 'Military' ? 3 : 1)
        }
      ];

      // Calculate total crew (excluding officers and medics)
      return baseCrew.reduce((sum, member) => sum + member.suggestedCount, 0);
    };

    const totalBaseCrew = calculateBaseCrew();

    const baseCrew: CrewMember[] = [
      {
        role: 'captain',
        skill: 'Leadership',
        count: 1,
        description: 'Usually the leading officer',
        isOptional: false,
        isRequired: true,
        suggestedCount: 1
      },
      {
        role: 'pilot',
        skill: 'Pilot',
        count: 1,
        description: 'Controls the ship during normal space operations',
        isOptional: false,
        isRequired: true,
        suggestedCount: crewType === 'Military' ? 3 : 1
      },
      {
        role: 'astrogator',
        skill: 'Astrogation',
        count: hasJumpDrive ? 1 : 0,
        description: 'Plots courses and handles astrogation',
        isOptional: false,
        isRequired: hasJumpDrive,
        suggestedCount: hasJumpDrive ? 1 : 0
      },
      {
        role: 'engineer',
        skill: 'Engineering',
        count: Math.max(1, Math.ceil((driveAndPowerPlantTons || 0) / 35)),
        description: 'Maintains and operates ship systems',
        isOptional: false,
        isRequired: true,
        suggestedCount: Math.max(1, Math.ceil((driveAndPowerPlantTons || 0) / 35))
      },
      {
        role: 'maintenance',
        skill: 'Mechanic',
        count: Math.ceil(shipSize / (crewType === 'Military' ? 500 : 1000)),
        description: 'Performs routine maintenance and repairs',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.ceil(shipSize / (crewType === 'Military' ? 500 : 1000))
      },
      {
        role: 'gunner',
        skill: 'Gunnery',
        count: hasWeapons ? (crewType === 'Military' ? 2 : 1) : 0,
        description: 'Operates ship weapons systems',
        isOptional: false,
        isRequired: hasWeapons,
        suggestedCount: hasWeapons ? (crewType === 'Military' ? 2 : 1) : 0
      },
      {
        role: 'steward',
        skill: 'Steward',
        count: Math.floor(shipSize / 1000), // 1 per 10 High or 100 Middle passengers
        description: 'Manages ship amenities and passenger services',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.floor(shipSize / 1000)
      },
      {
        role: 'administrator',
        skill: 'Admin',
        count: Math.floor(shipSize / (crewType === 'Military' ? 1000 : 2000)), // 1 per 1000/2000 tons
        description: 'Handles ship administration and paperwork',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.floor(shipSize / (crewType === 'Military' ? 1000 : 2000))
      },
      {
        role: 'sensorOperator',
        skill: 'Electronics (sensors)',
        count: Math.ceil(shipSize / 7500) * (crewType === 'Military' ? 3 : 1),
        description: 'Operates ship sensors and electronic systems',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.ceil(shipSize / 7500) * (crewType === 'Military' ? 3 : 1)
      },
      {
        role: 'Medic',
        skill: 'Medical',
        count: Math.ceil(totalBaseCrew / 120), // 1 per 120 crew
        description: 'Provides medical care to crew and passengers',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.ceil(totalBaseCrew / 120)
      },
      {
        role: 'Officer',
        skill: 'Leadership or Persuade',
        count: Math.floor(totalBaseCrew / (crewType === 'Military' ? 10 : 20)), // 1 per 10/20 crew
        description: 'Assists in ship operations and management',
        isOptional: true,
        isRequired: false,
        suggestedCount: Math.floor(totalBaseCrew / (crewType === 'Military' ? 10 : 20))
      }
    ];

    // Apply crew reduction for large ships
    const applyCrewReduction = (count: number, role: string): number => {
      if (shipSize <= 5000) return count;
      if (!['engineer', 'maintenance', 'gunner', 'administrator', 'sensorOperator'].includes(role)) return count;
      
      let multiplier = 1;
      if (shipSize <= 19999) multiplier = 0.75;
      else if (shipSize <= 49999) multiplier = 0.67;
      else if (shipSize <= 99999) multiplier = 0.50;
      else multiplier = 0.33;
      
      return Math.ceil(count * multiplier);
    };

    // Preserve user-defined values when updating crew members
    setCrewMembers(prevMembers => {
      // Always preserve existing member counts and update suggested counts
      return baseCrew.map(newMember => {
        const existingMember = prevMembers.find(m => m.role === newMember.role);
        const initialCount = initialCrewComposition[newMember.role];
        return {
          ...newMember,
          count: existingMember?.count ?? initialCount ?? 0, // Keep existing count, then initial count, then 0
          suggestedCount: applyCrewReduction(newMember.count, newMember.role)
        };
      });
    });
  }, [shipSize, hasJumpDrive, hasWeapons, crewType, driveAndPowerPlantTons, initialCrewComposition]);

  // Add effect to update medic and officer counts when total crew changes
  React.useEffect(() => {
    const totalCrew = crewMembers.reduce((sum, member) => {
      if (member.isOptional && getEffectiveCount(member) === 0) return sum;
      return sum + getEffectiveCount(member);
    }, 0);

    setCrewMembers(prevMembers => {
      return prevMembers.map(member => {
        if (member.role === 'Medic') {
          return {
            ...member,
            suggestedCount: Math.ceil(totalCrew / 120)
          };
        }
        if (member.role === 'Officer') {
          return {
            ...member,
            suggestedCount: Math.floor(totalCrew / (crewType === 'Military' ? 10 : 20))
          };
        }
        return member;
      });
    });
  }, [crewType]);

  const handleCountChange = (role: string, value: number) => {
    // Update local state
    setManualOverrides(prev => ({
      ...prev,
      [role]: value
    }));
    
    // Create a new crew composition object
    const newCrewComposition = crewMembers.reduce((acc, member) => {
      const count = member.role === role ? value : getEffectiveCount(member);
      if (count > 0) {
        // Always use lowercase for role names
        const roleKey = member.role.toLowerCase();
        // Special handling for specific roles
        if (roleKey === 'steward') {
          acc.steward = count;
        } else if (roleKey === 'sensoroperator') {
          acc.sensorOperator = count;
        } else {
          acc[roleKey] = count;
        }
      }
      return acc;
    }, {} as {[key: string]: number});
    
    // Notify parent of changes
    onCrewCountChange(newCrewComposition);
  };

  const getEffectiveCount = (member: CrewMember): number => {
    return manualOverrides[member.role] !== undefined 
      ? manualOverrides[member.role] 
      : member.count;
  };

  const totalCrew = crewMembers.reduce((sum, member) => {
    if (member.isOptional && getEffectiveCount(member) === 0) return sum;
    return sum + getEffectiveCount(member);
  }, 0);

  const handleCrewTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCrewType(event.target.value as 'Commercial' | 'Military');
  };

  const capitalizeRole = (role: string): string => {
    return role.split(/(?=[A-Z])/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div>
      <h2>Crew Requirements</h2>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Crew Type:
            <select
              value={crewType}
              onChange={handleCrewTypeChange}
              style={{
                marginLeft: 8,
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                color: '#333'
              }}
            >
              <option value="Commercial">Commercial</option>
              <option value="Military">Military</option>
            </select>
          </label>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: '4px' }}>
          {crewType === 'Military' ? 
            'Military crews require more specialized roles and have stricter requirements.' :
            'Commercial crews can be more flexible with role assignments.'}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {crewMembers.map((member) => (
            <div key={member.role} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              padding: '15px',
              border: '1px solid #333',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <strong>{capitalizeRole(member.role)}</strong>
                {member.isOptional && (
                  <span style={{ fontSize: 12, color: '#888' }}>(Optional)</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                Skill: {member.skill}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {member.description}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Count:
                  <input
                    type="number"
                    min={0}
                    value={getEffectiveCount(member)}
                    onChange={(e) => handleCountChange(member.role, parseInt(e.target.value))}
                    style={{
                      marginLeft: 8,
                      width: 80,
                      padding: '4px 8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      color: '#333'
                    }}
                  />
                </label>
                <span style={{ fontSize: 12, color: '#888' }}>
                  (Suggested: {member.suggestedCount} {member.isRequired ? '- Minimum recommended' : ''})
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '20px',
          border: '1px solid #333',
          borderRadius: '8px',
          backgroundColor: '#1a1a1a'
        }}>
          <h3>Crew Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Total Crew Required:
                <input
                  type="number"
                  value={totalCrew}
                  readOnly
                  style={{
                    marginLeft: 8,
                    width: 80,
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                    color: '#333'
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewRequirements; 