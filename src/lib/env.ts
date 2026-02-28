function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}\n` +
        `Check your .env file or Vercel environment settings.`
    );
  }
  return value;
}

export function getDatabaseUrl(): string {
  return required("DATABASE_URL");
}

export function getAnthropicApiKey(): string {
  return required("ANTHROPIC_API_KEY");
}
