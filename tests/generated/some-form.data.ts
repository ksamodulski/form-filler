export class TestData {
  static getValidData() {
    return {
      name: 'John Doe',
      email: 'test@example.com',
      contactNumber: '12345678901', // 11+ digits as required
      color: 'Red',
      food: 'Pizza',
      country: 'United States',
      date: '' // Optional field
    };
  }

  static getInvalidContactData() {
    return {
      name: 'Jane Smith',
      email: 'jane@example.com',
      contactNumber: '123-456-7890', // Contains non-numeric characters
      color: 'Blue',
      food: 'Burger',
      country: 'Canada'
    };
  }

  static getMinimalValidData() {
    return {
      name: 'Test User',
      email: 'testuser@test.com',
      contactNumber: '11111111111',
      color: 'Green',
      food: 'Pasta',
      country: 'Australia'
    };
  }

  static getFormFieldSelectors() {
    return {
      nameField: 'textbox[name="Name*"]',
      emailField: 'textbox[name="Email*"]',
      contactField: 'textbox[name="Contact Number*"]',
      dateField: 'textbox[name="Date"]',
      fileUpload: 'button:has-text("Upload File*")',
      colorRadios: {
        red: 'radio[name="Red"]',
        green: 'radio[name="Green"]',
        blue: 'radio[name="Blue"]',
        yellow: 'radio[name="Yellow"]'
      },
      foodCheckboxes: {
        pasta: 'checkbox[name="Pasta"]',
        pizza: 'checkbox[name="Pizza"]',
        burger: 'checkbox[name="Burger"]',
        sandwich: 'checkbox[name="Sandwich"]'
      },
      countryDropdown: 'combobox[name="Select Country*"]',
      submitButton: 'form button:has-text("Submit")'
    };
  }
}