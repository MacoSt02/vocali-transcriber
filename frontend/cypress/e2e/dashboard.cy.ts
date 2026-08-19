import { seedCognitoSession } from '../support/cognito';

describe('Dashboard (authenticated)', () => {
  beforeEach(() => {
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        seedCognitoSession(win, 'e2e@example.com');
      },
    });
  });

  it('renders the transcription screen instead of redirecting to login', () => {
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('h1', 'Transcribir audio').should('be.visible');
    cy.contains('button', 'Fichero').should('be.visible');
    cy.contains('button', 'Tiempo real').should('be.visible');
  });

  it('keeps the transcribe button disabled until a file is selected', () => {
    cy.contains('button', 'Transcribir').should('be.disabled');
  });
});
