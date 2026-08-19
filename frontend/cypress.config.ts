import { defineConfig } from 'cypress';
import { loadEnv } from 'vite';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(_on, config) {
      const env = loadEnv('development', process.cwd(), '');
      config.env.cognitoClientId = env.VITE_COGNITO_CLIENT_ID;
      return config;
    },
  },
});
