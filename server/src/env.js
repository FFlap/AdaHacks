function required(env, key) {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getEnv(source = process.env) {
  return {
    port: Number(source.PORT ?? 4010),
    clientOrigin: required(source, 'CLIENT_ORIGIN'),
    supabaseUrl: required(source, 'SUPABASE_URL'),
    supabasePublishableKey: required(source, 'SUPABASE_PUBLISHABLE_KEY'),
    openRouterApiKey: required(source, 'OPENROUTER_API_KEY'),
    openRouterModel: required(source, 'OPENROUTER_MODEL')
  };
}
