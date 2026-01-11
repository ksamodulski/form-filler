# Form Filler

AI-powered form testing framework that uses Playwright MCP + Claude to discover web forms and generate Playwright tests automatically.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Testing:** Playwright
- **AI:** Anthropic Claude API + Playwright MCP
- **Config:** dotenv (.env file)

## Project Structure

```
src/
├── discover.ts          # Main discovery orchestration
├── config.ts            # Environment configuration
├── lib/                 # Core infrastructure (MCP, Anthropic, file-writer)
├── prompts/             # LLM prompt templates
└── seeds/               # Pre-discovery steps (login, navigation)

tests/generated/         # Generated test files (.spec.ts + .data.ts)
docs/ARCHITECTURE.md     # Detailed architecture documentation
```

## Key Concepts

- **Discovery:** LLM explores forms via Playwright MCP, generates test code directly
- **Seeds:** Functions that run before discovery (login, navigation to form)
- **Generated artifacts:** `{form}.spec.ts` (test) + `{form}.data.ts` (data generator)

## Commands

```bash
npm run discover         # Run form discovery (requires FORM_URL in .env)
npx playwright test      # Run generated tests
```

## Configuration

Required in `.env`:
- `ANTHROPIC_API_KEY` - Claude API key
- `FORM_URL` - Target form URL

See `.env.example` for all options.

## Workflow

1. Set `FORM_URL` in `.env`
2. Run `npm run discover`
3. Review generated files in `tests/generated/`
4. Run tests: `npx playwright test tests/generated/{form}.spec.ts`

## Architecture Details

See `docs/ARCHITECTURE.md` for:
- Discovery flow and phases
- Locator quality standards
- Seed system design
- Future extensions
