/**
 * Discovery prompt template for form exploration.
 */

export function getDiscoveryPrompt(formUrl: string): string {
  return `You are a test automation expert. Your task is to explore a web form and generate a Playwright test file for it.

Target URL: ${formUrl}

## Instructions

1. Navigate to the form URL using browser_navigate
2. Take a snapshot to see the form structure
3. Quickly test each form field type ONCE (one text input, one radio, one dropdown, etc.)
4. Fill ALL required fields and submit the form to verify successful submission
5. Generate the test files using the best available locators (see Locator Quality below)

## Locator Quality Guidelines

When generating test code, prefer accessible locators in this priority order:

1. \`page.getByRole('button', { name: 'Submit' })\` - Best for buttons, links, checkboxes, radios
2. \`page.getByLabel('Email')\` - Best for form inputs with visible labels
3. \`page.getByPlaceholder('Enter email')\` - When input has placeholder but no label
4. \`page.getByText('Welcome')\` - For text content verification

Use ID or CSS selectors only when accessible locators are not available for an element.

**Web-First Assertions (auto-waiting):**
\`\`\`typescript
// Correct - waits and retries
await expect(page.getByText('Success')).toBeVisible();

// Avoid - fails immediately
expect(await page.getByText('Success').isVisible()).toBe(true);
\`\`\`

## CRITICAL: Be Efficient
- Do NOT exhaustively test every field - just discover the locator patterns
- After ~10 interactions, you MUST stop exploring and generate the output
- Use accessible locators when elements have labels, roles, or text; otherwise use MCP locators
- If a click times out, try an alternative approach ONCE, then move on

## Required Tests (NO MORE THAN 3 tests)

1. **Successful form submission** (MANDATORY): Fill all required fields with valid data and submit. Verify success message or state change.
2. Optionally: Form validation or element visibility tests.

Keep it minimal. Quality over quantity.

## Output Format

After exploring, output EXACTLY this format (required for file extraction):

\`\`\`TEST_FILE
// Your complete Playwright test file (no more than 3 tests)
\`\`\`

\`\`\`DATA_GENERATOR
// Your data generator file here (keep it simple - just valid test data)
\`\`\`

Start now. Be quick and efficient.`;
}

export function getNudgePrompt(): string {
  return 'You have explored enough. Now STOP exploring and generate the TEST_FILE and DATA_GENERATOR output immediately.';
}
