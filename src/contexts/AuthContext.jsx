import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

const PROFILE_CACHE_KEY = 'cached_profile';

function getCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache expires after 7 days
    if (Date.now() - parsed._cachedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedProfile(profile) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ ...profile, _cachedAt: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function clearCachedProfile() {
  localStorage.removeItem(PROFILE_CACHE_KEY);
}

export const AuthProvider = ({ children }) => {
  const cached = getCachedProfile();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(cached);
  // Always start in loading state to allow Supabase to restore session
  // (Prevents logout-on-reload bug)
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const initialProfileDone = useRef(!!cached);

  const fetchProfile = async (userId) => {
    console.log('AuthContext: Fetching profile for:', userId);
    setProfileLoading(true);
    try {
      // 5-second timeout for profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      
      if (error) {
        console.warn('AuthContext: Profile fetch error:', error.message);
        // Only nullify if we don't already have one (e.g. initial login)
        if (!profile) setProfile(null);
      } else {
        console.log('AuthContext: Profile loaded:', data?.role);
        setProfile(data);
        setCachedProfile(data);
        initialProfileDone.current = true;
      }
    } catch (err) {
      console.error('AuthContext: fetchProfile failed:', err.message);
      if (!profile) setProfile(null);
      initialProfileDone.current = true;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Global fail-safe: Force loading to false after 6 seconds
    const globalTimeout = setTimeout(() => {
      setLoading(false);
      setProfileLoading(false);
      console.warn('AuthContext: Global loading timeout triggered');
    }, 6000);

    // Get current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          clearCachedProfile();
        }
      } catch (err) {
        console.error('AuthContext: Session init error:', err);
      } finally {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth event:', event);
        try {
          // Skip profile re-fetch on token refreshes to prevent
          // app reload when switching tabs/apps
          if (event === 'TOKEN_REFRESHED') {
            console.log('AuthContext: Token refreshed, skipping profile re-fetch');
            return;
          }
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
            clearCachedProfile();
            initialProfileDone.current = false;
          }
        } catch (err) {
          console.error('AuthContext: Auth change error:', err);
        } finally {
          setLoading(false);
          clearTimeout(globalTimeout);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(globalTimeout);
    };
  }, []);

  // Google OAuth
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  // Email + password sign-in (Gmail only)
  const signInWithEmail = async (email, password) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      throw new Error('Only Gmail addresses are allowed.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Email + password sign-up (Gmail only)
  const signUpWithEmail = async (email, password) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      throw new Error('Only Gmail addresses are allowed.');
    }
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  // Password reset email
  const resetPassword = async (email) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      throw new Error('Only Gmail addresses are allowed.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // Update password (used on ResetPassword page)
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const logout = async () => {
    clearCachedProfile();
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      profileLoading,
      initialProfileDone: initialProfileDone.current,
      isAdmin,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      updatePassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
