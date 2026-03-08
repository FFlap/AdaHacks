import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import AppShell from '../components/layout/AppShell.jsx';
import { getMe, updateProfile } from '../lib/api.js';
import { avatarAccept, uploadAvatar, validateAvatarFile } from '../lib/profileMedia.js';
import { useAuth } from '../context/useAuth.js';

let projectKeyCounter = 0;
const emptyContactLinks = {
  linkedin: '',
  instagram: '',
  twitter: '',
  github: '',
  email: '',
  phone: ''
};

function newProjectKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  projectKeyCounter += 1;
  return `project-${projectKeyCounter}`;
}

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

function createProjectFormState(project = {}) {
  return {
    id: project.id,
    uiKey: project.id ?? newProjectKey(),
    name: project.name ?? '',
    theme: project.theme ?? '',
    description: project.description ?? '',
    techStack: project.techStack ?? [],
    techInput: ''
  };
}

function mapProfileToForm(profile) {
  return {
    fullName: profile.fullName,
    bio: profile.bio,
    contactLinks: {
      ...emptyContactLinks,
      ...(profile.contactLinks ?? {})
    },
    skills: profile.skills,
    projects: (profile.projects ?? []).map(createProjectFormState)
  };
}

function toProjectPayload(project) {
  const payload = {
    name: project.name,
    theme: project.theme,
    description: project.description,
    techStack: project.techStack
  };

  if (project.id) {
    payload.id = project.id;
  }

  return payload;
}

function toContactLinksPayload(contactLinks) {
  return Object.entries(contactLinks).reduce((accumulator, [key, value]) => {
    const normalizedValue = value.trim();

    if (normalizedValue) {
      accumulator[key] = normalizedValue;
    }

    return accumulator;
  }, {});
}

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const [activeEditorTab, setActiveEditorTab] = useState('profile');
  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    bio: '',
    contactLinks: emptyContactLinks,
    skills: [],
    projects: []
  });
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
      setForm(mapProfileToForm(response.profile));
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

  function addProject() {
    setError('');
    setActiveEditorTab('projects');
    setForm((current) => ({
      ...current,
      projects: [...current.projects, createProjectFormState()]
    }));
  }

  function removeProject(projectKey) {
    setForm((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.uiKey !== projectKey)
    }));
  }

  function updateProjectField(projectKey, field, value) {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((project) => (
        project.uiKey === projectKey
          ? { ...project, [field]: value }
          : project
      ))
    }));
  }

  function addProjectTechStack(projectKey, rawValue) {
    const activeProject = form.projects.find((project) => project.uiKey === projectKey);

    if (!activeProject) {
      return;
    }

    const value = (rawValue ?? activeProject.techInput).replace(/,+$/, '').trim();

    if (!value) {
      updateProjectField(projectKey, 'techInput', '');
      return;
    }

    if (activeProject.techStack.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      updateProjectField(projectKey, 'techInput', '');
      return;
    }

    if (activeProject.techStack.length >= 16) {
      setError('Add 16 tech stack items or fewer per project.');
      return;
    }

    setError('');
    setForm((current) => ({
      ...current,
      projects: current.projects.map((project) => (
        project.uiKey === projectKey
          ? {
            ...project,
            techStack: [...project.techStack, value],
            techInput: ''
          }
          : project
      ))
    }));
  }

  function removeProjectTechStack(projectKey, stackItem) {
    setForm((current) => ({
      ...current,
      projects: current.projects.map((project) => (
        project.uiKey === projectKey
          ? {
            ...project,
            techStack: project.techStack.filter((entry) => entry !== stackItem)
          }
          : project
      ))
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
        contactLinks: toContactLinksPayload(form.contactLinks),
        skills: form.skills,
        projects: form.projects.map(toProjectPayload)
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
      setForm(mapProfileToForm(response.profile));
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
    <AppShell>
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
            <section className="profile-side__projects">
              <p className="profile-side__section-label">Projects</p>
              {form.projects.length ? (
                <div className="profile-side__project-list">
                  {form.projects.map((project, index) => (
                    <article className="profile-side__project" key={project.uiKey}>
                      <p>{project.name || `Project ${String(index + 1).padStart(2, '0')}`}</p>
                      <span>{project.theme || 'Theme pending'}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="profile-side__empty">No projects added yet</p>
              )}
            </section>
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
            <div aria-label="Profile editor sections" className="editor-tabs" role="tablist">
              <button
                aria-controls="profile-panel"
                aria-selected={activeEditorTab === 'profile'}
                className={`editor-tab ${activeEditorTab === 'profile' ? 'is-active' : ''}`}
                id="profile-tab"
                onClick={() => setActiveEditorTab('profile')}
                role="tab"
                type="button"
              >
                Profile
              </button>
              <button
                aria-controls="projects-panel"
                aria-selected={activeEditorTab === 'projects'}
                className={`editor-tab ${activeEditorTab === 'projects' ? 'is-active' : ''}`}
                id="projects-tab"
                onClick={() => setActiveEditorTab('projects')}
                role="tab"
                type="button"
              >
                Projects
              </button>
            </div>
            <p className="eyebrow">Profile</p>
            <h2>{activeEditorTab === 'profile' ? 'Profile details' : 'Project list'}</h2>
            <p className="lede">
              {activeEditorTab === 'profile'
                ? 'Add your avatar, write a short bio, and keep one clean list for your stack.'
                : 'Keep project entries separate from the base profile so the editor stays easier to scan.'}
            </p>
            {loading ? (
              <div className="loading-panel">Pulling profile data from the API.</div>
            ) : (
              <form className="stack" onSubmit={handleSubmit}>
                {activeEditorTab === 'profile' ? (
                  <div
                    aria-labelledby="profile-tab"
                    className="editor-panel"
                    id="profile-panel"
                    role="tabpanel"
                  >
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
                    <section className="profile-section">
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">Contact info</p>
                          <p className="section-copy">
                            Add the links and contact details used in notifications when someone swipes on your profile or projects.
                          </p>
                        </div>
                      </div>
                      <div className="field-grid">
                        <label className="field">
                          <span>LinkedIn</span>
                          <input
                            name="linkedin"
                            placeholder="https://linkedin.com/in/your-name"
                            value={form.contactLinks.linkedin}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                linkedin: event.target.value
                              }
                            }))}
                          />
                        </label>
                        <label className="field">
                          <span>Instagram</span>
                          <input
                            name="instagram"
                            placeholder="https://instagram.com/your-handle"
                            value={form.contactLinks.instagram}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                instagram: event.target.value
                              }
                            }))}
                          />
                        </label>
                        <label className="field">
                          <span>Twitter / X</span>
                          <input
                            name="twitter"
                            placeholder="https://x.com/your-handle"
                            value={form.contactLinks.twitter}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                twitter: event.target.value
                              }
                            }))}
                          />
                        </label>
                        <label className="field">
                          <span>GitHub</span>
                          <input
                            name="github"
                            placeholder="https://github.com/your-handle"
                            value={form.contactLinks.github}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                github: event.target.value
                              }
                            }))}
                          />
                        </label>
                        <label className="field">
                          <span>Email</span>
                          <input
                            name="contactEmail"
                            placeholder="you@example.com"
                            value={form.contactLinks.email}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                email: event.target.value
                              }
                            }))}
                            type="email"
                          />
                        </label>
                        <label className="field">
                          <span>Phone number</span>
                          <input
                            name="phone"
                            placeholder="+1 555 123 4567"
                            value={form.contactLinks.phone}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              contactLinks: {
                                ...current.contactLinks,
                                phone: event.target.value
                              }
                            }))}
                            type="tel"
                          />
                        </label>
                      </div>
                    </section>
                  </div>
                ) : (
                  <section
                    aria-labelledby="projects-tab"
                    className="editor-panel profile-section profile-section--projects"
                    id="projects-panel"
                    role="tabpanel"
                  >
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">Projects</p>
                        <p className="section-copy">Add the projects you want attached to this profile.</p>
                      </div>
                      <button className="button button--secondary button--inline" onClick={addProject} type="button">
                        Add project
                      </button>
                    </div>
                    {form.projects.length ? (
                      <div className="project-stack">
                        {form.projects.map((project, index) => (
                          <article className="project-card" key={project.uiKey}>
                            <div className="project-card__header">
                              <div>
                                <p className="project-card__eyebrow">Project {String(index + 1).padStart(2, '0')}</p>
                                <p className="project-card__title">{project.name || 'Untitled project'}</p>
                              </div>
                              <button
                                className="button button--secondary button--inline"
                                onClick={() => removeProject(project.uiKey)}
                                type="button"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="project-grid">
                              <label className="field">
                                <span>Project name</span>
                                <input
                                  aria-label={`Project ${index + 1} name`}
                                  value={project.name}
                                  onChange={(event) => updateProjectField(project.uiKey, 'name', event.target.value)}
                                  required
                                />
                              </label>
                              <label className="field">
                                <span>Theme</span>
                                <input
                                  aria-label={`Project ${index + 1} theme`}
                                  placeholder="Hackathon, climate, fintech..."
                                  value={project.theme}
                                  onChange={(event) => updateProjectField(project.uiKey, 'theme', event.target.value)}
                                />
                              </label>
                            </div>
                            <div className="field">
                              <span>Tech stack</span>
                              <div className="skill-composer">
                                <input
                                  aria-label={`Project ${index + 1} tech stack`}
                                  placeholder="Add React, Supabase, Expo..."
                                  value={project.techInput}
                                  onChange={(event) => updateProjectField(project.uiKey, 'techInput', event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ',') {
                                      event.preventDefault();
                                      addProjectTechStack(project.uiKey);
                                    }
                                  }}
                                />
                                <button
                                  className="button button--secondary button--inline"
                                  onClick={() => addProjectTechStack(project.uiKey)}
                                  type="button"
                                >
                                  Add
                                </button>
                              </div>
                              <div className="chip-list">
                                {project.techStack.length ? (
                                  project.techStack.map((stackItem) => (
                                    <button
                                      className="chip"
                                      key={`${project.uiKey}-${stackItem}`}
                                      onClick={() => removeProjectTechStack(project.uiKey, stackItem)}
                                      type="button"
                                    >
                                      <span>{stackItem}</span>
                                      <span aria-hidden="true">×</span>
                                    </button>
                                  ))
                                ) : (
                                  <p className="field-note">Add the languages, tools, and frameworks used here.</p>
                                )}
                              </div>
                            </div>
                            <label className="field">
                              <span>Description</span>
                              <textarea
                                aria-label={`Project ${index + 1} description`}
                                rows="4"
                                placeholder="What does it do and why does it matter?"
                                value={project.description}
                                onChange={(event) => updateProjectField(project.uiKey, 'description', event.target.value)}
                              />
                            </label>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-projects">
                        <p>No projects added yet.</p>
                        <span>Start with one strong project card and build out from there.</span>
                      </div>
                    )}
                  </section>
                )}
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
    </AppShell>
  );
}
