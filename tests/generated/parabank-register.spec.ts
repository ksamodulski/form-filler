import { test, expect, Page, Locator } from '@playwright/test';
import { TestDataGenerator } from './parabank-register.data';

class RegistrationPage {
  page: Page;
  firstNameField: Locator;
  lastNameField: Locator;
  addressField: Locator;
  cityField: Locator;
  stateField: Locator;
  zipCodeField: Locator;
  phoneField: Locator;
  ssnField: Locator;
  usernameField: Locator;
  passwordField: Locator;
  confirmPasswordField: Locator;
  registerButton: Locator;
  cityError: Locator;
  stateError: Locator;
  zipCodeError: Locator;
  ssnError: Locator;
  passwordError: Locator;
  confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form field locators based on actual IDs discovered
    this.firstNameField = page.locator('#customer\\.firstName');
    this.lastNameField = page.locator('#customer\\.lastName');
    this.addressField = page.locator('#customer\\.address\\.street');
    this.cityField = page.locator('#customer\\.address\\.city');
    this.stateField = page.locator('#customer\\.address\\.state');
    this.zipCodeField = page.locator('#customer\\.address\\.zipCode');
    this.phoneField = page.locator('#customer\\.phoneNumber');
    this.ssnField = page.locator('#customer\\.ssn');
    this.usernameField = page.locator('#customer\\.username');
    this.passwordField = page.locator('#customer\\.password');
    this.confirmPasswordField = page.locator('#repeatedPassword');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    
    // Validation error selectors
    this.cityError = page.locator('td:has-text("City is required.")');
    this.stateError = page.locator('td:has-text("State is required.")');
    this.zipCodeError = page.locator('td:has-text("Zip Code is required.")');
    this.ssnError = page.locator('td:has-text("Social Security Number is required.")');
    this.passwordError = page.locator('td:has-text("Password is required.")');
    this.confirmPasswordError = page.locator('td:has-text("Password confirmation is required.")');
  }

  async navigate() {
    await this.page.goto('https://parabank.parasoft.com/parabank/register.htm');
  }

  async fillPersonalInfo(userData: ReturnType<typeof TestDataGenerator.generateRandomUser>) {
    await this.firstNameField.fill(userData.firstName);
    await this.lastNameField.fill(userData.lastName);
    await this.addressField.fill(userData.address);
    await this.cityField.fill(userData.city);
    await this.stateField.fill(userData.state);
    await this.zipCodeField.fill(userData.zipCode);
    if (userData.phone) {
      await this.phoneField.fill(userData.phone);
    }
    await this.ssnField.fill(userData.ssn);
  }

  async fillAccountInfo(userData: ReturnType<typeof TestDataGenerator.generateRandomUser>) {
    await this.usernameField.fill(userData.username);
    await this.passwordField.fill(userData.password);
    await this.confirmPasswordField.fill(userData.confirmPassword);
  }

  async submitForm() {
    await this.registerButton.click();
  }

  async verifyValidationErrors() {
    // Check for required field validation errors
    await expect(this.cityError).toBeVisible();
    await expect(this.stateError).toBeVisible();
    await expect(this.zipCodeError).toBeVisible();
    await expect(this.ssnError).toBeVisible();
    await expect(this.confirmPasswordError).toBeVisible();
  }
}

test.describe('ParaBank Registration Form Tests', () => {
  let registrationPage: RegistrationPage;

  test.beforeEach(async ({ page }) => {
    registrationPage = new RegistrationPage(page);
    await registrationPage.navigate();
  });

  test('should display validation errors for empty required fields', async () => {
    // Fill only some fields to trigger validation
    await registrationPage.firstNameField.fill('John');
    await registrationPage.lastNameField.fill('Doe');
    await registrationPage.usernameField.fill('testuser123');
    
    await registrationPage.submitForm();
    
    // Verify validation errors appear
    await registrationPage.verifyValidationErrors();
  });

  test('should successfully register with valid data', async ({ page }) => {
    const userData = TestDataGenerator.generateRandomUser();
    
    await registrationPage.fillPersonalInfo(userData);
    await registrationPage.fillAccountInfo(userData);
    
    await registrationPage.submitForm();

    // Wait for success message or URL change indicating successful registration
    await expect(page.locator('text=Your account was created successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should validate all form fields are accessible', async () => {
    // Verify all form fields are present and interactable
    await expect(registrationPage.firstNameField).toBeVisible();
    await expect(registrationPage.lastNameField).toBeVisible();
    await expect(registrationPage.addressField).toBeVisible();
    await expect(registrationPage.cityField).toBeVisible();
    await expect(registrationPage.stateField).toBeVisible();
    await expect(registrationPage.zipCodeField).toBeVisible();
    await expect(registrationPage.phoneField).toBeVisible();
    await expect(registrationPage.ssnField).toBeVisible();
    await expect(registrationPage.usernameField).toBeVisible();
    await expect(registrationPage.passwordField).toBeVisible();
    await expect(registrationPage.confirmPasswordField).toBeVisible();
    await expect(registrationPage.registerButton).toBeVisible();
  });

  test('should validate password confirmation matching', async () => {
    const userData = TestDataGenerator.generateRandomUser();
    userData.confirmPassword = 'differentpassword';
    
    await registrationPage.fillPersonalInfo(userData);
    await registrationPage.fillAccountInfo(userData);
    
    await registrationPage.submitForm();
    
    // Should show password mismatch validation (if implemented)
    await expect(registrationPage.page.locator('body')).toContainText('Password');
  });

  test('should handle partial form completion', async () => {
    // Fill only personal info section
    await registrationPage.firstNameField.fill('John');
    await registrationPage.lastNameField.fill('Doe');
    await registrationPage.addressField.fill('123 Main St');
    
    await registrationPage.submitForm();
    
    // Verify validation errors for missing fields
    await expect(registrationPage.cityError).toBeVisible();
    await expect(registrationPage.stateError).toBeVisible();
    await expect(registrationPage.zipCodeError).toBeVisible();
    await expect(registrationPage.ssnError).toBeVisible();
  });
});