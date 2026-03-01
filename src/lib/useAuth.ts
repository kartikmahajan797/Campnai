import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { AuthService } from '../services/authService';

/**
 * Global flag to prevent useAuth from re-establishing session
 * during logout. Set to true before logout, reset after signOut completes.
 */
let isLoggingOut = false;

export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Re-establish backend JWT session on page reload — but NOT during logout
      if (currentUser && !isLoggingOut) {
        try {
          await AuthService.establishSession();
        } catch (err) {
          console.warn('[useAuth] Failed to re-establish backend session:', err);
        }
      }

      // Reset the flag after Firebase confirms sign-out (currentUser = null)
      if (!currentUser && isLoggingOut) {
        isLoggingOut = false;
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
