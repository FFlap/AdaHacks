import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { getMe, updateProfile } from '../lib/api.js';
import { useAuth } from '../context/useAuth.js';

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ fullName: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfile = useEffectEvent(async () => {
    if (!session?.access_token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getMe(session.access_token);
      setData(response);
      setForm({
        fullName: response.profile.fullName,
        bio: response.profile.bio
      });
    } catch (loadError) {
      if (loadError.status === 401) {
        await signOut();
        return;
      }

      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    loadProfile();
  }, [session?.access_token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await updateProfile(session.access_token, form);
      setData(response);
      startTransition(() => {
        setNotice('Profile saved.');
      });
    } catch (saveError) {
      if (saveError.status === 401) {
        await signOut();
        return;
      }

      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shell">
      <section className="profile-layout">
        <aside className="card profile-side">
          <p className="brand-mark">AdaHacks</p>
          <p className="eyebrow">Session boundary</p>
          <p className="profile-side__email">{data?.user.email ?? session.user.email}</p>
          <dl className="meta-list">
            <div>
              <dt>Profile created</dt>
              <dd>{data ? new Date(data.profile.createdAt).toLocaleString() : 'Waiting for data'}</dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd>{data ? new Date(data.profile.updatedAt).toLocaleString() : 'Waiting for data'}</dd>
            </div>
          </dl>
          <button className="button button--secondary" type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </aside>
        <div className="card profile-main">
          <p className="eyebrow">Profile</p>
          <h2>Profile details</h2>
          <p className="lede">
            Update the record managed by the API and stored behind row-level security.
          </p>
          {loading ? (
            <div className="loading-panel">Pulling profile data from the API.</div>
          ) : (
            <form className="stack" onSubmit={handleSubmit}>
              <label className="field">
                <span>Full name</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Bio</span>
                <textarea
                  name="bio"
                  rows="6"
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  required
                />
              </label>
              {notice ? <p className="notice notice--success">{notice}</p> : null}
              {error ? <p className="notice notice--error">{error}</p> : null}
              <button className="button" disabled={saving} type="submit">
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
