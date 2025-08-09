
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OrganisationEmailScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since we simplified the flow
    router.replace('/auth/login');
  }, []);

  return null;
}
