class FormDataGenerator {
  static generatePersonalInfo() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    return {
      firstName: this.randomItem(firstNames),
      lastName: this.randomItem(lastNames),
      email: `${this.randomItem(firstNames).toLowerCase()}.${this.randomItem(lastNames).toLowerCase()}@example.com`,
      mobile: this.generateMobile(),
      gender: this.randomItem(['Male', 'Female', 'Other'])
    };
  }

  static generateMobile() {
    return '1' + Math.floor(Math.random() * 9000000000 + 1000000000).toString();
  }

  static generateDateOfBirth() {
    const year = Math.floor(Math.random() * 40) + 1970; // 1970-2009
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${year}`;
  }

  static generateSubjects() {
    const allSubjects = [
      'Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
      'History', 'Geography', 'Economics', 'Computer Science', 'Arts'
    ];
    
    const numSubjects = Math.floor(Math.random() * 3) + 1; // 1-3 subjects
    const subjects = [];
    
    while (subjects.length < numSubjects) {
      const subject = this.randomItem(allSubjects);
      if (!subjects.includes(subject)) {
        subjects.push(subject);
      }
    }
    
    return subjects;
  }

  static generateHobbies() {
    const allHobbies = [
      { id: '#hobbies-checkbox-1', name: 'Sports' },
      { id: '#hobbies-checkbox-2', name: 'Reading' },
      { id: '#hobbies-checkbox-3', name: 'Music' }
    ];
    
    const numHobbies = Math.floor(Math.random() * 3) + 1; // 1-3 hobbies
    const selectedHobbies = [];
    
    while (selectedHobbies.length < numHobbies) {
      const hobby = this.randomItem(allHobbies);
      if (!selectedHobbies.find(h => h.id === hobby.id)) {
        selectedHobbies.push(hobby);
      }
    }
    
    return selectedHobbies;
  }

  static generateAddress() {
    const streets = ['Main Street', 'Oak Avenue', 'Pine Road', 'Elm Drive', 'First Street'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    
    const streetNumber = Math.floor(Math.random() * 9999) + 1;
    const street = this.randomItem(streets);
    const city = this.randomItem(cities);
    
    return `${streetNumber} ${street}, ${city}`;
  }

  static generateStateAndCity() {
    const stateCityMap = {
      'NCR': ['Delhi', 'Gurgaon', 'Noida'],
      'Uttar Pradesh': ['Agra', 'Lucknow', 'Merrut'],
      'Haryana': ['Karnal', 'Panipat'],
      'Rajasthan': ['Jaipur', 'Jaiselmer']
    };
    
    const state = this.randomItem(Object.keys(stateCityMap));
    const city = this.randomItem(stateCityMap[state]);
    
    return { state, city };
  }

  static generateCompleteFormData() {
    const personalInfo = this.generatePersonalInfo();
    const stateCity = this.generateStateAndCity();
    
    return {
      ...personalInfo,
      dateOfBirth: this.generateDateOfBirth(),
      subjects: this.generateSubjects(),
      hobbies: this.generateHobbies(),
      currentAddress: this.generateAddress(),
      state: stateCity.state,
      city: stateCity.city
    };
  }

  static randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Method to generate test data for specific test scenarios
  static generateTestScenarios() {
    return {
      validUser: this.generateCompleteFormData(),
      minimalUser: {
        firstName: 'Test',
        lastName: 'User', 
        mobile: '1234567890',
        gender: 'Male'
      },
      longTextUser: {
        firstName: 'A'.repeat(50),
        lastName: 'B'.repeat(50),
        email: 'very.long.email.address@example.com',
        mobile: '1234567890',
        currentAddress: 'A'.repeat(200),
        gender: 'Female'
      },
      edgeCaseUser: {
        firstName: 'José',
        lastName: "O'Connor",
        email: 'test+user@example.co.uk',
        mobile: '1000000000',
        gender: 'Other'
      }
    };
  }
}

// Export for use in tests
export { FormDataGenerator };

// Usage example in tests:
// const testData = FormDataGenerator.generateCompleteFormData();
// await page.getByRole('textbox', { name: 'First Name' }).fill(testData.firstName);