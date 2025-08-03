
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AppEntry() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to splash screen
    router.replace('/splash');
  }, []);

  return null; // This component doesn't render anything
}
