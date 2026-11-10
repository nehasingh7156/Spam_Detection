import { useContext } from 'react';
import DetectionContext from '../context/DetectionContext';

export const useDetection = () => {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
};

export default useDetection;
