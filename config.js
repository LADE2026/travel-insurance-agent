// =============================================
// CONFIGURATION
// Replace ANTHROPIC_API_KEY with your key.
// For production, move this to a backend proxy.
// =============================================
const CONFIG = {
  // Paste your Anthropic API key here
  // Paste your Anthropic API key here (never commit this to git)
  ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_API_KEY',

  // Claude model to use
  MODEL: 'claude-sonnet-4-6',

  // Max tokens for each response
  MAX_TOKENS: 1024,

  // Temperature (0-1). Higher = more creative
  TEMPERATURE: 0.7,
};
