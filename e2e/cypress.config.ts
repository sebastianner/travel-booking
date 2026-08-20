import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.API_URL ?? 'http://localhost:3001',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
  },
});
