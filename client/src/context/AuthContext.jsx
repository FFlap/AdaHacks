import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState
} from 'react';
import { supabase } from '../lib/supabase.js';
import { AuthContext } from './context.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');

  const applySession = useEffectEvent((nextSession) => {
    startTransition(() => {
      setSession(nextSession);
      setStatus('ready');
    });
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        setStatus('ready');
        return;
      }

      applySession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    status,
    async signIn({ email, password }) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }
    },
    async signUp({ email, password }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return data;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
