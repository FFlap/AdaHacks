import {
  useCallback,
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from 'react';
import { getMe } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { AuthContext } from './context.js';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [cachedMe, setCachedMe] = useState(null);
  const inFlightMeRequestRef = useRef(null);
  const inFlightMeTokenRef = useRef('');

  const applySession = useEffectEvent((nextSession) => {
    startTransition(() => {
      setSession(nextSession);
      if (!nextSession) {
        setCachedMe(null);
      }
      inFlightMeRequestRef.current = null;
      inFlightMeTokenRef.current = '';
      setStatus('ready');
    });
  });

  const refreshCachedMe = useCallback(async ({ force = false } = {}) => {
    const token = session?.access_token;

    if (!token) {
      return null;
    }

    if (!force && cachedMe) {
      return cachedMe;
    }

    if (inFlightMeRequestRef.current && inFlightMeTokenRef.current === token) {
      return inFlightMeRequestRef.current;
    }

    const request = getMe(token)
      .then((response) => {
        setCachedMe(response);
        return response;
      })
      .finally(() => {
        if (inFlightMeRequestRef.current === request) {
          inFlightMeRequestRef.current = null;
          inFlightMeTokenRef.current = '';
        }
      });

    inFlightMeRequestRef.current = request;
    inFlightMeTokenRef.current = token;

    return request;
  }, [cachedMe, session?.access_token]);

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

  const value = useMemo(() => ({
    session,
    status,
    cachedMe,
    setCachedMe,
    refreshCachedMe,
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

      setCachedMe(null);
      inFlightMeRequestRef.current = null;
      inFlightMeTokenRef.current = '';
    }
  }), [cachedMe, refreshCachedMe, session, status]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
