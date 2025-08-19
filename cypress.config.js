const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      apiUrl: 'http://localhost:5000/api/v1',
      testUser: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    },
    setupNodeEvents(on, config) {
      // Task for database seeding
      on('task', {
        seedDatabase() {
          // This would connect to test database and seed data
          return null;
        },
        clearDatabase() {
          // This would clear test database
          return null;
        },
        log(message) {
          console.log(message);
          return null;
        }
      });

      // Performance testing
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
        }
        return launchOptions;
      });

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
});
