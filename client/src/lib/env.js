function required(name) {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizedUrl(value) {
  return value ? value.replace(/\/+$/, '') : '';
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  supabasePublishableKey: required('VITE_SUPABASE_PUBLISHABLE_KEY'),
  apiBaseUrl: normalizedUrl(import.meta.env.VITE_API_URL)
};
