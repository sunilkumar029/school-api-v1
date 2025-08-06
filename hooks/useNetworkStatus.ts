
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-async-storage/async-storage';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    // For web platform, assume connection is available
    if (typeof navigator !== 'undefined') {
      setIsConnected(navigator.onLine);
      setIsInternetReachable(navigator.onLine);
      
      const handleOnline = () => {
        setIsConnected(true);
        setIsInternetReachable(true);
      };
      
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    // For React Native, you would use NetInfo here
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setIsConnected(state.isConnected);
    //   setIsInternetReachable(state.isInternetReachable);
    // });
    // return unsubscribe;
  }, []);

  return { isConnected, isInternetReachable };
}
