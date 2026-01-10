# Form Testing MVP - Claude Code Prompt

## Goal

Build a proof-of-concept that uses Playwright MCP to discover a form and generate a parameterized Playwright test that fills it with coherent test data.

**Test form:** https://demoqa.com/automation-practice-form

## What to Build

A Node.js script that:

1. Uses `@playwright/mcp` to navigate to the form and understand its structure
2. Interacts with each field to discover how it works (text input, dropdown, radio, etc.)
3. Generates a Playwright test file that:
   - Fills all fields with realistic, coherent test data
   - Submits the form
   - Uses a data generation function that can be swapped for different test runs

## Output

A working Playwright test file like:

```typescript
// Generated test for: Student Registration Form
// Discovered: 2025-01-10

import { test, expect } from '@playwright/test';
import { generateTestData } from './data-generator';

test('fill student registration form', async ({ page }) => {
  const data = generateTestData();
  
  await page.goto('https://demoqa.com/automation-practice-form');
  
  // Discovered fields and their locators
  await page.getByPlaceholder('First Name').fill(data.firstName);
  await page.getByPlaceholder('Last Name').fill(data.lastName);
  // ... etc
  
  await page.getByRole('button', { name: 'Submit' }).click();
});
```

Plus a simple data generator:

```typescript
export function generateTestData() {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    // ... coherent data for all discovered fields
  };
}
```

## Tech Stack

- TypeScript
- `@playwright/mcp` (run: `npx @playwright/mcp@latest --caps vision`)
- Anthropic API for form understanding

## Constraints

- Keep it simple - single script, minimal dependencies
- No intermediate schema files - go straight to test code
- Extract locators from MCP responses (it returns the Playwright code it ran)
- Data should be coherent (e.g., name matches gender if both exist)

## Success Criteria

Running the generated test with `npx playwright test` should:
1. Open the form
2. Fill all fields
3. Submit successfully (or show validation errors if the form requires specific formats)
