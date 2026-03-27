import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    console.log('AuthContext: Fetching profile for:', userId);
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
        setProfile(null);
      } else {
        console.log('AuthContext: Profile loaded:', data?.role);
        setProfile(data);
      }
    } catch (err) {
      console.error('AuthContext: fetchProfile failed:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Global fail-safe: Force loading to false after 10 seconds
    const globalTimeout = setTimeout(() => {
      setLoading(false);
      console.warn('AuthContext: Global loading timeout triggered');
    }, 10000);

    // Get current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
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
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            setUser(null);
            setProfile(null);
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
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
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
