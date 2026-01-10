export class TestDataGenerator {
  static generateRandomUser() {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH'];
    const streets = ['Main Street', 'Oak Avenue', 'Park Drive', 'First Street', 'Second Avenue', 'Elm Street'];
    
    return {
      firstName: this.randomFromArray(firstNames),
      lastName: this.randomFromArray(lastNames),
      address: `${Math.floor(Math.random() * 9999) + 1} ${this.randomFromArray(streets)}`,
      city: this.randomFromArray(cities),
      state: this.randomFromArray(states),
      zipCode: this.generateZipCode(),
      phone: this.generatePhoneNumber(),
      ssn: this.generateSSN(),
      username: `user${timestamp}${randomNum}`,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    };
  }

  static generateInvalidUser() {
    return {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      ssn: '',
      username: 'testuser',
      password: '',
      confirmPassword: ''
    };
  }

  static generatePartialUser() {
    return {
      firstName: 'John',
      lastName: 'Doe',
      address: '123 Test Street',
      city: '', // Missing required field
      state: '', // Missing required field
      zipCode: '', // Missing required field
      phone: '555-123-4567',
      ssn: '', // Missing required field
      username: `partial${Date.now()}`,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    };
  }

  static generatePasswordMismatchUser() {
    const user = this.generateRandomUser();
    user.confirmPassword = 'DifferentPassword123!';
    return user;
  }

  static randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static generateZipCode() {
    return String(Math.floor(Math.random() * 90000) + 10000);
  }

  static generatePhoneNumber() {
    const area = Math.floor(Math.random() * 700) + 200;
    const exchange = Math.floor(Math.random() * 700) + 200;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${area}-${exchange}-${number}`;
  }

  static generateSSN() {
    const area = String(Math.floor(Math.random() * 700) + 100).padStart(3, '0');
    const group = String(Math.floor(Math.random() * 90) + 10).padStart(2, '0');
    const serial = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
    return `${area}-${group}-${serial}`;
  }

  // Test data sets for different scenarios
  static getValidUserDataSet() {
    return [
      this.generateRandomUser(),
      this.generateRandomUser(),
      this.generateRandomUser()
    ];
  }

  static getInvalidUserDataSet() {
    return [
      this.generateInvalidUser(),
      this.generatePartialUser(),
      this.generatePasswordMismatchUser()
    ];
  }

  // Edge case data
  static getLongFieldDataUser() {
    return {
      firstName: 'A'.repeat(50),
      lastName: 'B'.repeat(50),
      address: 'C'.repeat(100),
      city: 'D'.repeat(50),
      state: 'EF',
      zipCode: '12345',
      phone: '555-123-4567',
      ssn: '123-45-6789',
      username: 'E'.repeat(30),
      password: 'LongPassword123!@#$',
      confirmPassword: 'LongPassword123!@#$'
    };
  }

  static getSpecialCharacterUser() {
    return {
      firstName: "O'Connor",
      lastName: "Smith-Jones",
      address: "123 St. Mary's Ave #2B",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      phone: "(555) 123-4567",
      ssn: "123-45-6789",
      username: "user_test.123",
      password: "Pass@123!$%",
      confirmPassword: "Pass@123!$%"
    };
  }
}

