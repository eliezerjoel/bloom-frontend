import { MailSlurp } from 'mailslurp-client';

const resetPasswordPath = 'auth/reset-password';
const email = 'tech@chayn.co';

describe('Reset password', () => {
  before(() => {
    cy.cleanUpTestState();
  });
  it('should navigate to the reset password page', () => {
    // Start from the home page
    cy.visit('/');

    // Find a link with an href attribute containing "login" and click it
    cy.get('a[href*="login"]', { timeout: 8000 }).click();

    // The new url should include "login"
    cy.url().should('include', 'auth/login');

    // Find a link with an href attribute containing "reset-password" and click it
    cy.get('a[href*="reset-password"]').click();

    cy.url().should('include', resetPasswordPath);

    // The new page should contain an h2 with "Reset your password"
    cy.get('h2', { timeout: 8000 }).contains('Reset your password');
  });

  it('should see resend-link button after typing known email', () => {
    cy.visit(resetPasswordPath);
    cy.wait(1000); // Waiting for dom to rerender as the email input was detaching
    cy.get('[qa-id=passwordResetEmailInput]', { timeout: 8000 }).type(email);
    cy.get('[qa-id=passwordResetEmailButton]').click();

    cy.get('p', { timeout: 8000 }).should(
      'contain',
      'Check your emails for a reset link from Bloom.',
    );
    cy.get('button[type="submit"]').contains('Resend email');
  });

  it('should receive email when known email submitted for password reset', async () => {
    const mailslurp = new MailSlurp({ apiKey: Cypress.env('CYPRESS_MAIL_SLURP_API_KEY') });

    const inboxId = Cypress.env('CYPRESS_INBOX_ID');

    // Retrieve inbox
    const inbox = await mailslurp.getInbox(inboxId);

    // Reset password
    cy.visit(resetPasswordPath);
    cy.get('[qa-id=passwordResetEmailInput]', { timeout: 8000 }).focus().type(`${email}{enter}`);
    cy.get('p', { timeout: 8000 })
      // check that front-end confirms an email has been sent
      .should('contain', 'Check your emails for a reset link from Bloom.')
      .then(async () => {
        // wait for email
        const latestEmail = await mailslurp.waitForLatestEmail(inbox.id, 8000);
        expect(latestEmail.subject).contains('Reset');
      });
  });
});