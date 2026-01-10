import 'dotenv/config';

export interface DiscoveryConfig {
  formUrl: string;
  formName: string;
  seedName: string | null;
  outputDir: string;
  model: string;
  maxIterations: number;
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Error: ${name} environment variable is not set.`);
    console.error('See .env.example for reference.');
    process.exit(1);
  }
  return value;
}

function getFormNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;
    return lastPart.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  } catch {
    return 'form';
  }
}

export function loadConfig(): DiscoveryConfig {
  const formUrl = requireEnv('FORM_URL');

  return {
    formUrl,
    formName: process.env.FORM_NAME || getFormNameFromUrl(formUrl),
    seedName: process.env.SEED_NAME || null,
    outputDir: process.env.OUTPUT_DIR || 'tests/generated',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    maxIterations: parseInt(process.env.MAX_ITERATIONS || '20', 10),
    browser: (process.env.BROWSER as DiscoveryConfig['browser']) || 'chromium',
    headless: process.env.HEADLESS === 'true',
  };
}
