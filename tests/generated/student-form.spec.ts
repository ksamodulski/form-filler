import { test, expect } from '@playwright/test';

test.describe('DemoQA Practice Form Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://demoqa.com/automation-practice-form');
    // Remove ads that interfere with tests (don't wait for networkidle - ads never stop)
    await page.evaluate(() => {
      document.querySelectorAll('#adplus-anchor, #fixedban, .ad-wrap, iframe[id*="google_ads"]').forEach(el => el.remove());
    });
  });

  test('should fill and submit the complete form', async ({ page }) => {
    // Fill text inputs (discovered locators from MCP)
    await page.getByRole('textbox', { name: 'First Name' }).fill('John');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
    await page.getByRole('textbox', { name: 'name@example.com' }).fill('john.doe@example.com');
    await page.getByRole('textbox', { name: 'Mobile Number' }).fill('1234567890');

    // Select gender (MCP discovered: use page.evaluate due to ad overlay)
    await page.evaluate(() => {
      (document.querySelector('input[value="Male"]') as HTMLInputElement)?.click();
    });

    // Fill date of birth - click to open picker, then select
    await page.locator('#dateOfBirthInput').click();
    await page.locator('.react-datepicker__month-select').selectOption('May');
    await page.locator('.react-datepicker__year-select').selectOption('1990');
    await page.locator('.react-datepicker__day--015:not(.react-datepicker__day--outside-month)').first().click();

    // Fill subjects (MCP discovered: type and select from dropdown)
    await page.locator('#subjectsInput').fill('Math');
    await page.getByText('Maths', { exact: true }).click();

    // Select hobbies (MCP discovered: use page.evaluate due to ad overlay)
    await page.evaluate(() => {
      (document.querySelector('#hobbies-checkbox-1') as HTMLInputElement)?.click();
    });

    // Scroll down to see address and state/city fields
    await page.locator('#stateCity-wrapper').scrollIntoViewIfNeeded();

    // Fill current address
    await page.locator('#currentAddress').fill('123 Main Street, New York City');

    // Select state (MCP discovered: type in input to filter)
    await page.locator('#react-select-3-input').fill('NCR');
    await page.waitForTimeout(500);
    await page.locator('[id*="react-select-3-option"]:has-text("NCR")').first().click();

    // Select city
    await page.locator('#react-select-4-input').fill('Delhi');
    await page.waitForTimeout(500);
    await page.locator('[id*="react-select-4-option"]:has-text("Delhi")').first().click();

    // Submit form
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify form submission
    await expect(page.locator('.modal-content')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.modal-title')).toContainText('Thanks for submitting the form');
  });

  test('should handle gender selection', async ({ page }) => {
    // Test each gender option
    const genders = ['Male', 'Female', 'Other'];

    for (const gender of genders) {
      await page.evaluate((genderValue) => {
        (document.querySelector(`input[value="${genderValue}"]`) as HTMLInputElement)?.click();
      }, gender);

      // Verify selection
      await expect(page.locator(`input[value="${gender}"]`)).toBeChecked();
    }
  });

  test('should handle hobby checkboxes', async ({ page }) => {
    const hobbies = [
      { id: '#hobbies-checkbox-1', name: 'Sports' },
      { id: '#hobbies-checkbox-2', name: 'Reading' },
      { id: '#hobbies-checkbox-3', name: 'Music' }
    ];

    // Select all hobbies
    for (const hobby of hobbies) {
      await page.evaluate((id) => {
        (document.querySelector(id) as HTMLInputElement)?.click();
      }, hobby.id);

      // Verify checkbox is checked
      await expect(page.locator(hobby.id)).toBeChecked();
    }

    // Unselect all hobbies
    for (const hobby of hobbies) {
      await page.evaluate((id) => {
        (document.querySelector(id) as HTMLInputElement)?.click();
      }, hobby.id);

      // Verify checkbox is unchecked
      await expect(page.locator(hobby.id)).not.toBeChecked();
    }
  });

  test('should handle state and city dropdowns', async ({ page }) => {
    // Test state selection
    await page.locator('#react-select-3-input').fill('Uttar Pradesh');
    await page.waitForTimeout(500);
    await page.locator('[id*="react-select-3-option"]:has-text("Uttar Pradesh")').first().click();

    // Verify state is selected
    await expect(page.locator('#react-select-3-input')).toHaveValue('');
    await expect(page.locator('.css-1uccc91-singleValue')).toContainText('Uttar Pradesh');

    // Test city selection (should be enabled after state selection)
    await page.locator('#react-select-4-input').fill('Agra');
    await page.waitForTimeout(500);
    await page.locator('[id*="react-select-4-option"]:has-text("Agra")').first().click();

    // Verify city is selected
    await expect(page.locator('[class*="singleValue"]:near(#react-select-4-input)')).toContainText('Agra');
  });

  test('should handle date picker', async ({ page }) => {
    // Click on date input to open picker
    await page.locator('#dateOfBirthInput').click();

    // Verify date picker is visible
    await expect(page.locator('.react-datepicker')).toBeVisible();

    // Select a specific date
    await page.locator('.react-datepicker__month-select').selectOption('January');
    await page.locator('.react-datepicker__year-select').selectOption('1995');
    await page.locator('.react-datepicker__day--015').click();

    // Verify date is set
    await expect(page.locator('#dateOfBirthInput')).toHaveValue('15 Jan 1995');
  });
});
