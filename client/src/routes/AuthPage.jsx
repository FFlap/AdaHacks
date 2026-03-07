import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

const PANELS = {
  signIn: {
    title: 'Login',
    cta: 'Login'
  },
  signUp: {
    title: 'Sign up',
    cta: 'Sign up'
  }
};

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signIn, signUp, status } = useAuth();
  const [mode, setMode] = useState('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const deferredMode = useDeferredValue(mode);

  useEffect(() => {
    if (status === 'ready' && session) {
      navigate(location.state?.from ?? '/profile', { replace: true });
    }
  }, [location.state, navigate, session, status]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords must match before the account can be created.');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'signIn') {
        await signIn({ email, password });
      } else {
        const data = await signUp({ email, password });

        if (data.session) {
          setMessage('Account created. Redirecting to your profile now.');
        } else {
          setMessage('Account created. Check your email to confirm the sign-up.');
        }
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="shell shell--auth">
      <section className="auth-wrap">
        <div className="card auth-card auth-card--compact">
          <p className="brand-mark">AdaHacks</p>
          <div className="auth-card__header">
            <h1 className="auth-card__title">{PANELS[deferredMode].title}</h1>
          </div>
          <div className="mode-switch">
            <button
              className={mode === 'signIn' ? 'mode-switch__button is-active' : 'mode-switch__button'}
              type="button"
              onClick={() => startTransition(() => setMode('signIn'))}
            >
              Login
            </button>
            <button
              className={mode === 'signUp' ? 'mode-switch__button is-active' : 'mode-switch__button'}
              type="button"
              onClick={() => startTransition(() => setMode('signUp'))}
            >
              Sign up
            </button>
          </div>
          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {mode === 'signUp' ? (
              <label className="field">
                <span>Confirm password</span>
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            ) : null}
            {message ? <p className="notice notice--success">{message}</p> : null}
            {error ? <p className="notice notice--error">{error}</p> : null}
            <button className="button" disabled={submitting} type="submit">
              {submitting ? 'Working...' : PANELS[mode].cta}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
