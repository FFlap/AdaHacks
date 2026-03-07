import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { getMe, updateProfile } from '../lib/api.js';
import { avatarAccept, uploadAvatar, validateAvatarFile } from '../lib/profileMedia.js';
import { useAuth } from '../context/useAuth.js';

function formatTimestamp(value) {
  if (!value) {
    return 'Waiting for data';
  }

  return new Date(value).toLocaleString();
}

function getInitials(name, email) {
  const source = name?.trim() || email?.trim() || '?';
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ fullName: '', bio: '', skills: [] });
  const [skillInput, setSkillInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');

  const liveAvatarUrl = avatarPreviewUrl || data?.profile.avatarUrl || '';
  const displayName = form.fullName || data?.profile.fullName || '';
  const initials = getInitials(displayName, data?.user.email ?? session.user.email);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [avatarFile]);

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
        bio: response.profile.bio,
        skills: response.profile.skills
      });
      setSkillInput('');
      setAvatarFile(null);
      setAvatarNotice('');
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

  function addSkill(rawValue = skillInput) {
    const value = rawValue.replace(/,+$/, '').trim();

    if (!value) {
      setSkillInput('');
      return;
    }

    if (form.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillInput('');
      return;
    }

    if (form.skills.length >= 16) {
      setError('Add 16 skills or fewer.');
      return;
    }

    setError('');
    setForm((current) => ({
      ...current,
      skills: [...current.skills, value]
    }));
    setSkillInput('');
  }

  function removeSkill(skillToRemove) {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove)
    }));
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateAvatarFile(file);

    if (validationError) {
      setError(validationError);
      setAvatarNotice('');
      event.target.value = '';
      return;
    }

    setError('');
    setNotice('');
    setAvatarNotice('Photo selected. Save the profile to upload it.');
    setAvatarFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    setAvatarNotice('');

    try {
      const payload = {
        fullName: form.fullName,
        bio: form.bio,
        skills: form.skills
      };
      const userId = data?.user.id ?? session.user.id;

      if (avatarFile) {
        if (!userId) {
          throw new Error('Profile session is not ready yet. Try again.');
        }

        payload.avatarPath = await uploadAvatar({
          userId,
          file: avatarFile
        });
      }

      const response = await updateProfile(session.access_token, payload);
      setData(response);
      setForm({
        fullName: response.profile.fullName,
        bio: response.profile.bio,
        skills: response.profile.skills
      });
      setAvatarFile(null);
      setSkillInput('');
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
          <div className="profile-side__identity">
            <div className="profile-side__avatar" aria-hidden="true">
              {liveAvatarUrl ? <img alt="" src={liveAvatarUrl} /> : <span>{initials}</span>}
            </div>
            <div>
              <p className="profile-side__name">{displayName || 'Complete your profile'}</p>
              <p className="profile-side__email">{data?.user.email ?? session.user.email}</p>
            </div>
          </div>
          <div className="profile-side__skills" aria-label="Current tech stack and frameworks">
            {form.skills.length ? (
              form.skills.map((skill) => (
                <span className="chip chip--static" key={skill}>
                  {skill}
                </span>
              ))
            ) : (
              <span className="profile-side__empty">No stack listed yet</span>
            )}
          </div>
          <dl className="meta-list">
            <div>
              <dt>Profile created</dt>
              <dd>{formatTimestamp(data?.profile.createdAt)}</dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd>{formatTimestamp(data?.profile.updatedAt)}</dd>
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
            Add your avatar, write a short bio, and keep one clean list for your stack.
          </p>
          {loading ? (
            <div className="loading-panel">Pulling profile data from the API.</div>
          ) : (
            <form className="stack" onSubmit={handleSubmit}>
              <section className="profile-section">
                <div className="field">
                  <span>Profile picture</span>
                  <div className="avatar-field">
                    <div className="avatar-field__preview" aria-hidden="true">
                      {liveAvatarUrl ? <img alt="" src={liveAvatarUrl} /> : <span>{initials}</span>}
                    </div>
                    <div className="avatar-field__body">
                      <label className="button button--secondary button--inline" htmlFor="avatar-upload">
                        {avatarFile ? 'Replace photo' : 'Upload photo'}
                      </label>
                      <input
                        accept={avatarAccept}
                        aria-label="Profile picture"
                        className="sr-only"
                        id="avatar-upload"
                        name="avatar"
                        onChange={handleAvatarChange}
                        type="file"
                      />
                      <p className="field-note">PNG, JPG, or WebP. Up to 2 MB.</p>
                    </div>
                  </div>
                </div>
              </section>
              <label className="field">
                <span>Full name</span>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                />
              </label>
              <div className="field">
                <span>Tech stack &amp; frameworks</span>
                <div className="skill-composer">
                  <input
                    aria-label="Tech stack & frameworks"
                    name="skills"
                    placeholder="Add React, Node.js, Supabase, Tailwind..."
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <button
                    className="button button--secondary button--inline"
                    onClick={() => addSkill()}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                <div className="chip-list">
                  {form.skills.length ? (
                    form.skills.map((skill) => (
                      <button
                        className="chip"
                        key={skill}
                        onClick={() => removeSkill(skill)}
                        type="button"
                      >
                        <span>{skill}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))
                  ) : (
                    <p className="field-note">Add the tools and frameworks you want visible on the card.</p>
                  )}
                </div>
              </div>
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
              {avatarNotice ? <p className="notice notice--success">{avatarNotice}</p> : null}
              {notice ? <p className="notice notice--success">{notice}</p> : null}
              {error ? <p className="notice notice--error">{error}</p> : null}
              <button className="button" disabled={saving} type="submit">
                {saving ? (avatarFile ? 'Uploading and saving...' : 'Saving...') : 'Save profile'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
