# Form Filler

Automatically discover web forms and generate Playwright tests using AI.

Uses Playwright MCP + Anthropic Claude to explore forms, identify fields, and generate test files with realistic data.

## Setup

```bash
npm install
npx playwright install chromium
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
ANTHROPIC_API_KEY=your-api-key-here
FORM_URL=https://example.com/your-form
FORM_NAME=my-form
```

## Usage

```bash
npm run discover
```

This will:
1. Open a browser and navigate to the form
2. Use Claude to explore and interact with form fields
3. Generate test files in `tests/generated/`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key | - |
| `FORM_URL` | Required. URL of the form to discover | - |
| `FORM_NAME` | Name for generated files | derived from URL |
| `SEED_NAME` | Seed to run before discovery | `default` |
| `OUTPUT_DIR` | Output directory for tests | `tests/generated` |
| `BROWSER` | Browser: chromium, firefox, webkit | `chromium` |
| `HEADLESS` | Run headless | `false` |
| `MAX_ITERATIONS` | Max discovery iterations | `20` |

## Custom Seeds

Seeds run before form discovery - useful for login flows or navigation.

1. Create `src/seeds/my-app.ts`:

```typescript
import { SeedFunction, callTool } from './types.js';

const seed: SeedFunction = async (mcpClient, formUrl) => {
  // Navigate to login
  await callTool(mcpClient, 'browser_navigate', { url: 'https://example.com/login' });

  // Fill credentials
  await callTool(mcpClient, 'browser_fill_form', {
    selector: '#username',
    value: process.env.APP_USERNAME
  });

  // Continue to form...
  await callTool(mcpClient, 'browser_navigate', { url: formUrl });
};

export default seed;
```

2. Register in `src/seeds/index.ts`:

```typescript
case 'my-app':
  return (await import('./my-app.js')).default;
```

3. Set in `.env`:

```env
SEED_NAME=my-app
APP_USERNAME=testuser
APP_PASSWORD=testpass
```

## Generated Files

After discovery, you'll find:

- `tests/generated/{form-name}.spec.ts` - Playwright test file
- `tests/generated/{form-name}.data.ts` - Test data generator

Run the generated tests:

```bash
npx playwright test tests/generated/{form-name}.spec.ts
```

## License

MIT
