import React, { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Welcome = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        window.location.href = '/signup';
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-8 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2">Welcome to Campnai</h1>
        <p className="text-muted-foreground mb-6">
          {user.displayName ? `Hi ${user.displayName}!` : `Signed in as ${user.email}`}
        </p>
        <p className="text-muted-foreground mb-6">
          You're ready to start automating your influencer marketing.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="bg-primary text-primary-foreground px-5 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={handleSignOut}
            className="border border-border text-foreground px-5 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
