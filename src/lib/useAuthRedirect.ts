import { useEffect, useRef } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

// Global flag to ensure getRedirectResult only runs once per app lifetime
let redirectResultChecked = false;

/**
 * Hook to handle Google OAuth redirect results.
 * MUST only be called once in the app - ideally in App.tsx or a top-level component.
 * This ensures the redirect result is consumed exactly once.
 */
export const useAuthRedirect = () => {
    const navigate = useNavigate();
    const hasChecked = useRef(false);

    useEffect(() => {
        // Double guard: global and local ref
        if (redirectResultChecked || hasChecked.current) {
            console.log('[Auth Redirect] Already checked, skipping');
            return;
        }

        hasChecked.current = true;
        redirectResultChecked = true;

        const checkRedirect = async () => {
            console.log('[Auth Redirect] 🔍 Checking for OAuth redirect result...');
            console.log('[Auth Redirect] Current URL:', window.location.href);

            // Immediate check
            if (auth.currentUser) {
                console.log('[Auth Redirect] ⚡ User already signed in via persistence:', auth.currentUser.uid);
                navigate('/dashboard', { replace: true });
                return;
            }

            try {
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('TIMEOUT')), 5000);
                });

                // Race getRedirectResult against timeout
                const result: any = await Promise.race([
                    getRedirectResult(auth),
                    timeoutPromise
                ]);

                console.log('[Auth Redirect] getRedirectResult returned:', result);

                if (result?.user) {
                    console.log('[Auth Redirect] ✅ SUCCESS! User authenticated');
                    setTimeout(() => {
                        console.log('[Auth Redirect] 🚀 Executing navigation NOW');
                        navigate('/dashboard', { replace: true });
                    }, 100);
                    return result;
                } else {
                    console.log('[Auth Redirect] ⚠️ No redirect result found');
                    return null;
                }
            } catch (error: any) {
                if (error.message === 'TIMEOUT') {
                    console.warn('[Auth Redirect] ⏳ getRedirectResult TIMED OUT after 5s');
                    console.log('[Auth Redirect] This implies a network issue or Firebase JS SDK hanging.');
                } else {
                    console.error('[Auth Redirect] ❌ ERROR processing redirect:', error);
                    console.error('[Auth Redirect] Error code:', error.code);
                    console.error('[Auth Redirect] Error message:', error.message);
                    console.error('[Auth Redirect] Full error:', error);
                }

                // Don't throw or show error for expected cases
                if (error.code === 'auth/popup-closed-by-user') {
                    console.log('[Auth Redirect] User closed popup, ignoring');
                    return null;
                }

                return null;
            }
        };

        checkRedirect();

        // Global listener specifically for debug
        const unsubscribe = auth.onAuthStateChanged(user => {
            console.log('[Global Auth Listener] State:', user ? 'Logged In (' + user.uid + ')' : 'Logged Out');
            if (user) {
                // Failsafe navigation
                // navigate('/dashboard', { replace: true }); // Let the other listeners handle it to avoid spam
            }
        });

        return () => unsubscribe();
    }, [navigate]);
};
