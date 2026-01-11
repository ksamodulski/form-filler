# AI-Powered Form Testing Framework
## Architecture v4 — Hybrid Approach

---

## 1. Overview

### 1.1 Purpose
Automated testing framework for complex, user-configured forms that:
- Understands form structure like a human (via LLM + Playwright MCP)
- Generates Playwright test code directly (no intermediate schema)
- Produces coherent, realistic test data
- Supports human review of generated tests before use

### 1.2 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **LLM-efficient** | LLM called only during discovery; test code reused thereafter |
| **Human-in-the-loop** | Generated tests verified/edited before use; failures reviewed |
| **Test-as-schema** | The Playwright test file IS the artifact — human-readable and executable |
| **Industry-agnostic** | Core framework decoupled from specific system navigation |

### 1.3 System Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                     SYSTEM UNDER TEST                            │
│            (HIS, ERP, CRM, or any form-based app)               │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Browser automation (Playwright MCP)
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    FORM TESTING FRAMEWORK                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              SEEDS (Pre-discovery)                         │ │
│  │         Login, Navigation to Form                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              DISCOVERY ENGINE                              │ │
│  │    Explore Form │ Generate Test │ Generate Data            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Generated .spec.ts + .data.ts
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXISTING TOOLING                              │
│         Git (versioning) │ PR Review │ Jenkins (execution)      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Concepts

### 2.1 Form Identifier

Each form is identified by its URL and a human-readable name. The name is used for generated file names.

**Configuration:**
- `FORM_URL` — The URL of the form to discover
- `FORM_NAME` — Name for generated files (derived from URL if not provided)

**Generated files:**
- `tests/generated/{form-name}.spec.ts`
- `tests/generated/{form-name}.data.ts`

### 2.2 Test File Lifecycle

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Discover │────►│  Review   │────►│  Commit   │────►│  Jenkins  │
│  (CLI)    │     │  (PR)     │     │  (Git)    │     │  (CI/CD)  │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
      │                                                     │
      │                    ┌────────────────────────────────┘
      │                    │ Test fails? Re-discover
      │                    ▼
      └────────────────────┘
```

**Workflow:**
1. Run `npm run discover` → generates `.spec.ts` and `.data.ts`
2. Review generated code
3. Run test locally (`npx playwright test {form}.spec.ts`) to verify it passes
4. Commit to git, create PR
5. Jenkins runs tests on merge
6. If tests fail later → investigate:
   - Form changed → re-run discovery
   - Bug in system under test → file bug report

**Artifacts per form:**
- `{form-id}.spec.ts` — The Playwright test file (human-editable)
- `{form-id}.data.ts` — Data generator for coherent test values

### 2.3 LLM Call Points (Exhaustive List)

| When | Purpose | Frequency |
|------|---------|-----------|
| **Discovery** | Analyze form via MCP, generate test code | Once per form |
| **Error interpretation** | Parse validation errors when patterns fail | Fallback only |

**LLM Call Audit:** All LLM calls are logged with timestamp, purpose, token count, latency, and cost.

**NOT using LLM:**
- Test execution (runs generated Playwright code)
- Data generation (uses typed generator functions)
- Change detection (test failure = form changed)

### 2.4 Test-as-Schema Approach

The generated Playwright test file serves as both executable test AND documentation:

```typescript
// form-abc123.spec.ts
// Generated: 2025-01-10
// Form: Patient Registration
// Status: APPROVED

import { test } from '@playwright/test';
import { generateData } from './form-abc123.data';

test('fill patient registration form', async ({ page }) => {
  const data = generateData();
  
  await page.goto('https://system.example.com/forms/patient');
  
  // Personal Information
  await page.getByLabel('First Name').fill(data.firstName);
  await page.getByLabel('Last Name').fill(data.lastName);
  await page.getByLabel('Date of Birth').fill(data.dateOfBirth);
  await page.getByRole('radio', { name: data.gender }).check();
  
  // Contact Details
  await page.getByLabel('Email').fill(data.email);
  await page.getByLabel('Phone').fill(data.phone);
  
  // Submit
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // Verify success (form-specific)
  await page.waitForSelector('.success-message');
});
```

**Benefits:**
- Human-readable — reviewers see exactly what the test does
- Human-editable — can fix locators, add waits, adjust flow
- Executable — runs directly with `npx playwright test`
- Version-controlled — standard git workflow for changes
- No translation layer — what you review is what runs

### 2.5 Discovery via Playwright MCP

The LLM uses Playwright MCP to interact with the form directly and generate test code:

1. **Navigate** — `browser_navigate` to form URL
2. **Snapshot** — `browser_snapshot` to see form structure with refs
3. **Interact** — `browser_click`, `browser_type`, etc. to validate each field
4. **Extract** — Parse locators from MCP responses (it returns the Playwright code it ran)
5. **Generate** — Output complete test file with data generator

The LLM operates like an experienced test engineer: explore the form, try each field, write the test.

### 2.6 Locator Quality Standards

Generated tests must follow Playwright best practices for resilient, maintainable locators.

**Locator Priority (highest to lowest):**

| Priority | Locator Type | Example | When to Use |
|----------|--------------|---------|-------------|
| 1 | Role + name | `getByRole('button', { name: 'Submit' })` | Buttons, links, checkboxes, radios, headings |
| 2 | Label | `getByLabel('Email')` | Form inputs with associated labels |
| 3 | Placeholder | `getByPlaceholder('Enter email')` | Inputs without labels |
| 4 | Text | `getByText('Welcome')` | Static text content |
| 5 | Test ID | `getByTestId('submit-btn')` | Only if app provides data-testid |

**Avoid (fragile locators):**

| Locator Type | Example | Problem |
|--------------|---------|---------|
| ID selector | `locator('#firstName')` | IDs change with refactoring |
| CSS class | `locator('.btn-primary')` | Classes change with styling |
| XPath | `locator('//div[2]/form/input')` | Breaks with DOM restructuring |
| Generated IDs | `locator('#react-select-3-input')` | Dynamic, unpredictable |

**Prompt Enforcement:**

The discovery prompt instructs the LLM to:
1. Prefer `getByRole`, `getByLabel` over selectors from MCP responses
2. Convert ID-based locators to accessible equivalents when possible
3. Use text-based locators only for verification, not interaction

**Example transformation:**

```typescript
// MCP returns:     page.locator('#customer\\.firstName')
// LLM generates:   page.getByLabel('First Name')

// MCP returns:     page.locator('button.submit-btn')
// LLM generates:   page.getByRole('button', { name: 'Submit' })
```

**Web-First Assertions:**

Always use auto-waiting assertions:
```typescript
// Correct - waits and retries
await expect(page.getByText('Success')).toBeVisible();

// Avoid - fails immediately if not ready
expect(await page.getByText('Success').isVisible()).toBe(true);
```

---

## 3. Module Architecture

### 3.1 Module Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ CORE INFRASTRUCTURE                                              │
│     Config, LLM Client, MCP Client, File Writer                 │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
┌─────────────────────────────────────────────────────────────────┐
│ SEEDS                                                            │
│     Login, Navigation, Overlay Dismissal                        │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
┌─────────────────────────────────────────────────────────────────┐
│ DISCOVERY ENGINE                                                 │
│     MCP Interaction │ Test Generation │ Data Generation         │
└─────────────────────────────────────────────────────────────────┘
          │
          │ Output: .spec.ts + .data.ts
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXISTING TOOLING (not part of framework)                         │
│     Git │ PR Review │ Jenkins                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Module Responsibilities

#### Core Infrastructure
| Component | Responsibility |
|-----------|----------------|
| Config | Environment-based configuration (`.env`) |
| LLM Client | Anthropic API wrapper with retry logic |
| MCP Client | Playwright MCP connection (`@playwright/mcp`) |
| File Writer | Extract and save generated test files |

#### Seeds (Pre-Discovery Steps)
| Component | Responsibility |
|-----------|----------------|
| Seed Function | Execute steps needed before form discovery (login, navigation, overlay dismissal) |
| Seed Loader | Dynamically load seed by name from `src/seeds/` |

**Current Implementation (MVP):**
- Seeds use MCP tools: `(mcpClient, formUrl) => Promise<void>`
- Works but unfamiliar API compared to Playwright

**Planned Improvement: Playwright-based Seeds**

Seeds should use native Playwright steps for a familiar API. Authentication state is passed to MCP via storage state.

```typescript
// Seed uses Playwright directly
export async function seed(page: Page, formUrl: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill('user');
  await page.getByLabel('Password').fill('pass');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard');
  await page.goto(formUrl);
}
```

**Flow with Storage State:**
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  1. Playwright  │────►│  2. Save state   │────►│  3. MCP starts  │
│  runs seed      │     │  (cookies, etc.) │     │  with state     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

1. Playwright browser runs seed (login, navigate)
2. `storageState` saved to file (cookies, localStorage)
3. MCP starts with saved state, discovery begins on authenticated session

#### Discovery Engine
| Component | Responsibility |
|-----------|----------------|
| MCP Orchestrator | Drive browser via MCP tools to explore form |
| Test Generator | Generate Playwright test file from MCP interactions |
| Data Generator Builder | Create typed data generator for coherent test values |

**Key Output:**
- `{form-id}.spec.ts` — Playwright test file
- `{form-id}.data.ts` — Data generator with typed fields

---

## 4. Generated Artifacts

Each form discovery produces two files:

**Test File:** `tests/generated/{form-id}.spec.ts`
```typescript
import { test } from '@playwright/test';
import { generateData } from './{form-id}.data';

test('fill form', async ({ page }) => {
  const data = generateData();
  await page.goto('...');
  // ... generated test code
});
```

**Data Generator:** `tests/generated/{form-id}.data.ts`
```typescript
export interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  // ... typed fields
}

export function generateData(): FormData {
  return {
    firstName: 'John',
    lastName: 'Doe',
    // ... coherent values
  };
}
```

---

## 5. Discovery Flow

The LLM uses Playwright MCP to explore the form and generate test code directly.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SEED (Pre-discovery)                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ • Run seed function (login, navigate to form)                           │
│ • Browser ready at form URL                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: EXPLORE                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ LLM uses MCP to:                                                        │
│ • Take snapshot to see all fields                                       │
│ • Interact with each field (click, type, select)                        │
│ • Discover dropdown options, validation rules                           │
│ • Find submit button and success indicators                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: GENERATE                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ LLM generates:                                                          │
│ • Test file ({form-id}.spec.ts) with accessible locators               │
│ • Data generator ({form-id}.data.ts) with coherent test values         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: SAVE                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ • Extract code blocks from LLM output                                   │
│ • Write files to tests/generated/                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

After discovery, the generated files are reviewed, committed to git, and run via Jenkins.

---

## 6. Configuration

### 6.1 Environment Variables (`.env`)

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional - Discovery settings
FORM_URL=https://example.com/form        # Target form URL
FORM_NAME=my-form                         # Output file name (derived from URL if not set)
SEED_NAME=default                         # Seed to run before discovery
OUTPUT_DIR=tests/generated                # Where to save generated files

# Optional - Browser settings
MODEL=claude-sonnet-4-20250514            # LLM model
MAX_ITERATIONS=20                         # Max discovery iterations
BROWSER=chromium                          # chromium | firefox | webkit
HEADLESS=false                            # true for CI
```

### 6.2 Running Discovery

```bash
# Using environment variables
FORM_URL=https://example.com/form npm run discover

# Or set in .env file and run
npm run discover
```

---

## 7. Development Phases

### Phase 1: MVP ✅
- [x] Basic MCP integration (connect to Playwright MCP)
- [x] LLM integration (Anthropic API)
- [x] Discovery script: navigate to form, interact, generate test
- [x] Seeds system for pre-discovery steps (login, navigation)
- [x] Locator quality guidelines in discovery prompt
- [x] **Milestone:** Can generate working tests for public forms (DemoQA, ParaBank)

### Phase 2: Production Hardening
- [ ] Refactor seeds to use Playwright steps (instead of MCP tools)
- [ ] Storage state handoff between Playwright seeds and MCP discovery
- [ ] Test generation for authenticated/internal forms
- [ ] Improved error handling and retry logic
- [ ] **Milestone:** Can generate tests for real production forms

---

## 8. File Structure

```
form-filler/
├── src/
│   ├── discover.ts          # Main discovery orchestration
│   ├── config.ts            # Environment-based configuration
│   ├── lib/
│   │   ├── mcp-client.ts    # Playwright MCP connection
│   │   ├── anthropic.ts     # LLM client with retry logic
│   │   └── file-writer.ts   # Extract and save generated files
│   ├── prompts/
│   │   └── discovery.ts     # Discovery prompt templates
│   └── seeds/               # Pre-discovery steps (login, navigation)
│       ├── types.ts         # Seed function type definition
│       ├── index.ts         # Seed loader
│       ├── default.ts       # Default seed (direct navigation)
│       └── {custom}.ts      # Custom seeds for authenticated apps
├── tests/
│   └── generated/           # Generated test files
│       ├── {form-id}.spec.ts
│       └── {form-id}.data.ts
├── .env                     # Configuration (API keys, defaults)
└── playwright.config.ts
```

---

## 9. Future Extensions

### 9.1 Component Helper Library (Optional)

For systems with a consistent UI component library (e.g., Angular Material, PrimeNG, custom design system), pre-defined helpers can reduce code duplication and improve test reliability.

**Concept:**

Instead of generating inline code for complex widgets, generated tests import shared helper functions:

```typescript
// Without helpers (current MVP)
await page.locator('#ng-select-3-input').fill('California');
await page.waitForTimeout(500);
await page.locator('[id*="ng-select-3-option"]:has-text("California")').first().click();

// With helpers (extension)
import { selectDropdownOption } from '../helpers/form-components';
await selectDropdownOption(page, 'State', 'California');
```

**Helper Categories:**

| Helper | Use Case |
|--------|----------|
| `selectDropdownOption(page, label, option)` | Custom select components (ng-select, mat-select, p-dropdown) |
| `selectDatepickerDate(page, label, date)` | Date picker widgets |
| `uploadFile(page, label, filePath)` | File input components |
| `selectMultiple(page, label, options)` | Multi-select components |
| `fillAutocomplete(page, label, text, option)` | Typeahead/autocomplete inputs |

**Integration Approach:**

1. **Pre-defined helpers**: Create helper functions based on known component library
2. **Prompt injection**: Include helper documentation in discovery prompt
3. **LLM decides**: Prompt specifies when to use helpers vs inline code

**Prompt Injection Example:**

```
## Available Helpers

Import: `import { selectDropdownOption } from '../helpers/form-components';`

### selectDropdownOption
Select option from custom dropdown (works with ng-select, mat-select, p-dropdown)
```typescript
await selectDropdownOption(page, 'Country', 'United States');
```

## When to Use Helpers

USE HELPERS when you encounter:
- Custom dropdown components (combobox role, typeahead behavior)
- Date picker widgets
- Multi-select fields

USE INLINE CODE when:
- Native HTML <input>, <textarea>, <select>
- Standard buttons and links
```

**Benefits:**

- Fix component interaction once, all tests benefit
- Consistent patterns across generated tests
- Framework-agnostic (helpers use Playwright's accessible locators)
- Easier maintenance when component library upgrades

**Implementation Files (when enabled):**

```
src/
├── helpers/
│   ├── form-components.ts    # Helper implementations
│   └── index.ts              # Catalog + re-exports
└── prompts/
    └── discovery.ts          # Inject helper docs into prompt
```

**Configuration:**

```yaml
framework:
  helpers:
    enabled: false          # MVP: disabled
    path: ./src/helpers     # Location of helper files
```

### 9.2 Data Generator Utilities (Optional)

Shared utilities for common data generation patterns:

```typescript
// Current: duplicated in each .data.ts file
static generatePhoneNumber() {
  return `${Math.floor(Math.random() * 900) + 100}-555-${Math.floor(Math.random() * 9000) + 1000}`;
}

// Extension: shared utility
import { phone, email, name } from '../helpers/test-data';
return { phone: phone(), email: email(), firstName: name.first() };
```

---

*Document Version: 5.0*
*Status: MVP Complete — Simplified architecture*
*Changes:*
- *v4.0: Discovery generates Playwright test code directly, no intermediate schema*
- *v4.1: Added locator quality standards, optional component helpers extension*
- *v4.2: Updated to reflect actual MVP implementation (seeds, .env config, file structure)*
- *v5.0: Simplified architecture — removed Test Store, Test Runner, Web Dashboard (use Git + Jenkins instead)*
