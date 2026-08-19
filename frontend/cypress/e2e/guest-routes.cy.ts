describe('Guest routes', () => {
  it('shows the login form on "/"', () => {
    cy.visit('/');
    cy.contains('Iniciar sesión').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('button[type=submit]').should('contain.text', 'Entrar');
  });

  it('shows a validation error when the password is missing', () => {
    cy.visit('/');
    cy.get('input#email').type('user@example.com');
    cy.get('button[type=submit]').click();
    cy.contains('La contraseña es obligatoria').should('be.visible');
  });

  it('navigates to the register page', () => {
    cy.visit('/');
    cy.contains('a', 'Crea una').click();
    cy.location('pathname').should('eq', '/register');
  });

  it('navigates to the forgot-password page', () => {
    cy.visit('/');
    cy.contains('a', '¿Olvidaste tu contraseña?').click();
    cy.location('pathname').should('eq', '/forgot-password');
  });

  it('redirects unauthenticated users away from protected routes', () => {
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/');
  });
});
