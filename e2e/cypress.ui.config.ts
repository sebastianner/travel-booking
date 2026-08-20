import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.APP_URL ?? 'http://localhost:3000',
    specPattern: 'cypress/ui/**/*.cy.ts',
    supportFile: false,
  },
});
