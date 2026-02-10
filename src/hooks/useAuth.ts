import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google login error:", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string) => {
        // Use Magic Link (OTP) for simpler experience without password management
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Email login error:", error);
            throw error;
        }
    };

    const signUpWithPassword = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Sign up error:", error);
            throw error;
        }
    };

    const signInWithPassword = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Sign in error:", error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    return {
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithPassword,
        signInWithPassword,
        signOut
    };
};
