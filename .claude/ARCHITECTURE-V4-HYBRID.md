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
                              │ Browser automation
                              │
┌──────────────────────────────────────────────────────────────────┐
│                    FORM TESTING FRAMEWORK                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              SYSTEM ADAPTER (Pluggable)                    │ │
│  │         Auth, Navigation, Form Selection                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              CORE ENGINE (System-agnostic)                 │ │
│  │    Discovery │ Test Gen │ Data Gen │ Runner │ Validation  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              WEB DASHBOARD                                  │ │
│  │      Discovery │ Test Review │ Failure Review │ Monitoring │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Concepts

### 2.1 Form Identifier

Each target system defines its own way to uniquely identify a form. The framework uses a generic `FormIdentifier` that adapters translate.

**MVP (HIS System 1):**
- `typeName` + `profile` + `formTag`

**Other systems might use:**
- URL path + query params
- Form ID attribute
- Menu path

The adapter converts system-specific identifiers to a canonical format for storage.

### 2.2 Test File Lifecycle

```
                        ┌─────────────────────────────────────┐
                        │           (re-discover)             │
                        ▼                                     │
    ┌─────────┐    ┌───────────┐    ┌──────────┐    ┌────────┴──┐
    │ UNKNOWN │───►│ DISCOVERY │───►│ PENDING  │───►│ APPROVED  │
    └─────────┘    └───────────┘    └──────────┘    └───────────┘
                        ▲                │                │
                        │                │ reject         │ form changed
                        │                ▼                │ (test fails)
                        │           ┌──────────┐          │
                        │           │ REJECTED │          │
                        │           │ (with    │          │
                        │           │  notes)  │          │
                        │           └────┬─────┘          │
                        │                │                │
                        │                │ retry          │
                        └────────────────┴────────────────┘
```

**States:**
- **UNKNOWN** — Form registered but no test exists
- **DISCOVERY** — Test generation in progress (transient)
- **PENDING** — Generated test awaiting human review
- **APPROVED** — Test reviewed and ready to run
- **REJECTED** — Human rejected generated test, needs re-discovery

**Artifacts per form:**
- `{form-id}.spec.ts` — The Playwright test file (human-editable)
- `{form-id}.data.ts` — Data generator for coherent test values
- `{form-id}.meta.json` — Metadata (status, discovered date, reviewer, etc.)

**Transitions:**
- Any state → DISCOVERY: Manual "re-discover" trigger
- APPROVED → PENDING: Auto-triggered when test starts failing consistently
- REJECTED → DISCOVERY: User clicks "retry discovery"

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

---

## 3. Module Architecture

### 3.1 Module Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ M1: CORE INFRASTRUCTURE                                          │
│     Config, Logger, LLM Client, MCP Client, File Storage        │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
┌─────────────────────────────────────────────────────────────────┐
│ M2: SYSTEM ADAPTER (Pluggable per target system)                │
│     Auth, Navigation, Form Selection                            │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
┌─────────┴─────────┬─────────────────┐
│ M3: DISCOVERY     │ M4: TEST STORE  │
│     ENGINE        │                 │
│                   │ - Test files    │
│ - MCP interaction │ - Data gens     │
│ - Test generation │ - Metadata      │
│ - Data gen        │ - Status        │
└─────────┬─────────┴────────┬────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ M5: TEST RUNNER                                                  │
│     Playwright Test execution, Result collection, Reporting      │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│ M6: WEB DASHBOARD                                                │
│     Discovery Trigger │ Test Review │ Failure Review │ Stats    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Module Responsibilities

#### M1: Core Infrastructure
| Component | Responsibility |
|-----------|----------------|
| Config | Environment-based configuration, validation |
| Logger | Structured logging with levels, file + console |
| LLM Client | Anthropic API wrapper, rate limiting, cost tracking, audit logging |
| MCP Client | Playwright MCP connection (`@playwright/mcp`) |
| File Storage | Store generated test files, data generators, metadata |

#### M2: System Adapter
| Component | Responsibility |
|-----------|----------------|
| Auth Provider | Login, session management, state persistence |
| Navigator | Navigate to form selection view |
| Form Selector | Select specific form by system-specific identifier |

**MVP Implementation:** HIS adapter with typeName/profile/formTag selection.

**Extensibility:** New systems implement adapter interface without changing core.

#### M3: Discovery Engine
| Component | Responsibility |
|-----------|----------------|
| MCP Orchestrator | Drive browser via MCP tools to explore form |
| Test Generator | Generate Playwright test file from MCP interactions |
| Data Generator Builder | Create typed data generator for coherent test values |

**Key Output:** 
- `{form-id}.spec.ts` — Playwright test file
- `{form-id}.data.ts` — Data generator with typed fields

#### M4: Test Store
| Component | Responsibility |
|-----------|----------------|
| Test Repository | Store/retrieve generated test files |
| Metadata Manager | Track status (pending/approved/rejected), timestamps, reviewer |
| Version Tracker | Keep history of test file versions |

#### M5: Test Runner
| Component | Responsibility |
|-----------|----------------|
| Executor | Run Playwright tests |
| Result Collector | Capture pass/fail, screenshots, errors |
| Failure Detector | Identify tests that start failing (form may have changed) |
| Reporter | Generate reports, queue failures for review |

#### M6: Web Dashboard
| Page | Responsibility |
|------|----------------|
| Discovery | Trigger new form discovery, view progress |
| Test Review | Review/edit/approve generated tests |
| Failure Review | Review test failures, trigger re-discovery |
| Monitoring | Stats, LLM usage, success rates |

---

## 4. Data Models

### 4.1 Generated Artifacts (per form)

**Test File:** `tests/{form-id}.spec.ts`
```typescript
// Generated: 2025-01-10T14:30:00Z
// Form: Patient Registration  
// Status: APPROVED

import { test } from '@playwright/test';
import { generateData } from './{form-id}.data';

test('fill form', async ({ page }) => {
  const data = generateData();
  await page.goto('...');
  // ... generated test code
});
```

**Data Generator:** `tests/{form-id}.data.ts`
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

**Metadata:** `tests/{form-id}.meta.json`
```json
{
  "formId": "patient-registration",
  "formUrl": "https://...",
  "status": "approved",
  "discoveredAt": "2025-01-10T14:30:00Z",
  "approvedBy": "jane@example.com",
  "approvedAt": "2025-01-10T15:00:00Z",
  "lastRun": "2025-01-10T16:00:00Z",
  "lastRunSuccess": true,
  "stats": { "runs": 42, "passed": 41, "failed": 1 }
}
```

### 4.2 Review Item

```
ReviewItem
├── id: UUID
├── type: new_test|test_failure
├── status: pending|in_progress|resolved
├── formId: string
├── payload
│   ├── [new_test]: {testFile, dataFile, screenshot}
│   └── [test_failure]: {error, screenshot, logs}
├── resolution?
│   ├── verdict: approved|rejected|bug_filed|re_discover
│   ├── notes: string
│   └── resolvedBy: string
└── timestamps: {created, updated, resolved}
```

### 4.3 Test Result

```
TestResult
├── id: UUID
├── formId: string
├── success: boolean
├── dataUsed: object (snapshot of generated data)
├── error?: string
├── screenshot?: string (path)
├── duration: number (ms)
└── timestamp: timestamp
```

### 4.4 LLM Call Audit

```
LLMCallAudit
├── id: UUID
├── formId?: string
├── purpose: discovery|error_interpretation
├── tokens: {input, output}
├── latencyMs: number
├── cost: number
└── timestamp: timestamp
```

---

## 5. Key Flows

### 5.1 Discovery Flow

The LLM uses Playwright MCP to explore the form and generate test code directly.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: EXPLORE                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ LLM uses MCP to:                                                        │
│ • Navigate to form URL                                                  │
│ • Take snapshot to see all fields                                       │
│ • Interact with each field (click, type, select)                        │
│ • Discover dropdown options                                             │
│ • Find submit button                                                    │
│                                                                         │
│ MCP returns the Playwright code it executed for each interaction        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: GENERATE TEST                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│ LLM generates:                                                          │
│                                                                         │
│ 1. Test file ({form-id}.spec.ts)                                        │
│    • Import data generator                                              │
│    • Navigate to form                                                   │
│    • Fill each field using locators from MCP                            │
│    • Submit and verify success                                          │
│                                                                         │
│ 2. Data generator ({form-id}.data.ts)                                   │
│    • TypeScript interface for form data                                 │
│    • Function that returns coherent test values                         │
│                                                                         │
│ 3. Metadata ({form-id}.meta.json)                                       │
│    • Status: PENDING                                                    │
│    • Timestamps, form URL, etc.                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: QUEUE FOR REVIEW                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • Save generated files                                                  │
│ • Create review item                                                    │
│ • Notify via dashboard                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Test Review Flow

```
Reviewer opens dashboard
         │
         ▼
┌─────────────────────────────────────┐
│ See pending tests                   │
│ • Form name                         │
│ • Field count                       │
│ • Discovery date                    │
└─────────────────┬───────────────────┘
                  ▼
Select test to review
         │
         ▼
┌─────────────────────────────────────┐
│ Review screen shows:                │
│ • Screenshot of form                │
│ • Generated test code (editable)    │
│ • Generated data generator          │
│ • "Run test" button to try it       │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   [Looks good]        [Needs fixes]
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Approve      │    │ Edit code in UI  │
│ Status →     │    │ or reject for    │
│ APPROVED     │    │ re-discovery     │
└──────────────┘    └──────────────────┘
```

### 5.3 Test Execution Flow

```
Trigger: Manual, scheduled, or CI
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Find approved tests              │
│    (status = APPROVED in metadata)  │
└─────────────────┬───────────────────┘
                  ▼
┌─────────────────────────────────────┐
│ 2. Run with Playwright              │
│    npx playwright test {form}.spec  │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    [Pass]              [Fail]
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Update stats │    │ Queue for review │
│ in metadata  │    │ • Error message  │
└──────────────┘    │ • Screenshot     │
                    │ • May need       │
                    │   re-discovery   │
                    └──────────────────┘
```

### 5.4 Change Detection

No fingerprints needed — **test failure = form may have changed**.

```
Test starts failing consistently
         │
         ▼
┌─────────────────────────────────────┐
│ Review failure:                     │
│ • Locator not found? → Form changed │
│ • Validation error? → Data issue    │
│ • Timeout? → App slow or broken     │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  [Form changed]      [Other issue]
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Re-discover  │    │ Fix data gen or  │
│ form         │    │ file bug         │
└──────────────┘    └──────────────────┘
```

---

## 6. Queues

### 6.1 Test Review Queue (New Tests)

**Purpose:** Human reviews generated tests before they can run.

**Entries created when:**
- New form discovered → test generated

**Resolution options:**
- **Approve** → Test can run
- **Edit & Approve** → Fix code, then approve
- **Reject** → Re-trigger discovery

### 6.2 Failure Review Queue

**Purpose:** Human reviews test failures.

**Entries created when:**
- Test fails

**Resolution options:**
- **Re-discover** → Form changed, generate new test
- **Fix data** → Update data generator
- **File bug** → Real application bug
- **Ignore** → Flaky test, known issue

---

## 7. Configuration

### 7.1 Framework Configuration

```yaml
framework:
  llm:
    provider: anthropic
    model: claude-sonnet-4-20250514
    apiKey: ${ANTHROPIC_API_KEY}
  
  mcp:
    command: "npx @playwright/mcp@latest --caps vision"
    browser: chromium
    headless: false  # true for CI
  
  storage:
    testsDir: ./tests/generated
    evidenceDir: ./evidence
  
  dashboard:
    port: 3000
```

### 7.2 System Adapter Configuration (MVP - HIS)

```yaml
adapter:
  type: his-v1
  baseUrl: https://his.example.com
  auth:
    strategy: form
    loginUrl: /login
    credentials:
      username: ${HIS_USERNAME}
      password: ${HIS_PASSWORD}
```

---

## 8. Development Phases

### Phase 1: MVP (Weeks 1-2)
- [ ] Basic MCP integration (connect to Playwright MCP)
- [ ] LLM integration (Anthropic API)
- [ ] Discovery script: navigate to form, interact, generate test
- [ ] **Milestone:** Can generate working test for DemoQA practice form

### Phase 2: System Adapter (Weeks 3-4)
- [ ] M2: System adapter for HIS (auth, navigation)
- [ ] Test generation for HIS forms
- [ ] **Milestone:** Can generate tests for real HIS forms

### Phase 3: Dashboard (Weeks 5-6)
- [ ] M6: Web dashboard (discovery trigger, test review)
- [ ] File-based test/metadata storage
- [ ] **Milestone:** Can trigger discovery and review tests via UI

### Phase 4: Test Runner & Review (Weeks 7-8)
- [ ] M5: Test runner (Playwright test execution)
- [ ] Failure review queue
- [ ] **Milestone:** Full workflow: discover → review → run → review failures

---

## 9. Open Questions

1. **Dashboard auth:** Simple password or SSO?
2. **Notifications:** Email/Slack when tests need review?
3. **CI/CD:** GitHub Actions or Jenkins integration?

---

## 10. File Structure

```
form-testing-framework/
├── src/
│   ├── discovery/           # MCP + LLM discovery
│   ├── adapters/            # System adapters (HIS, etc.)
│   ├── runner/              # Playwright test execution
│   └── dashboard/           # Web UI
├── tests/
│   └── generated/           # Generated test files
│       ├── {form-id}.spec.ts
│       ├── {form-id}.data.ts
│       └── {form-id}.meta.json
├── evidence/                # Screenshots, logs
└── config/
    └── config.yaml
```

---

*Document Version: 4.0*
*Status: Hybrid approach — test file as schema*
*Key change: Discovery generates Playwright test code directly, no intermediate schema*
