import React from 'react';

interface StateroomSelectionProps {
  totalStaterooms: number;
  doubleOccupancy: boolean;
  lowBerths: number;
  emergencyLowBerths: number;
  commonAreaPercentage: number;
  onDoubleOccupancyToggle: () => void;
  onStateroomChange: (value: number) => void;
  onLowBerthChange: (value: number) => void;
  onEmergencyLowBerthChange: (value: number) => void;
  onCommonAreaChange: (value: number) => void;
}

const StateroomSelection: React.FC<StateroomSelectionProps> = ({
  totalStaterooms,
  doubleOccupancy,
  lowBerths,
  emergencyLowBerths,
  commonAreaPercentage,
  onDoubleOccupancyToggle,
  onStateroomChange,
  onLowBerthChange,
  onEmergencyLowBerthChange,
  onCommonAreaChange
}) => {
  return null; // Component is no longer needed as functionality has been moved to App.tsx
};

export default StateroomSelection; 