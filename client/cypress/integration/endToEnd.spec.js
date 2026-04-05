
describe('Web site availability', () => {

    after(() => {
      cy.contains("Delete").click({ force: true });
      }); 
      it('Sanity listings web site', () => {
        cy.visit('http://localhost:5173');
        cy.contains('Create Record').should('exist');
      });
      it('Test Adding Employee listings', () => {
        cy.visit('http://localhost:5173/create');
        cy.get('#name').type("Employee1");
        cy.get('#email').type("email1");
        cy.get("#emailIntern").click({ force: true });
        cy.contains("Create person").click({ force: true });
        cy.visit('http://localhost:5173');
        cy.contains('Employee1').should('exist');
      });
     /* it('Test Editing Employee listings', () => {
        //cy.visit('http://localhost:3000');
        cy.contains('Edit').click({ force: true })
        cy.on('url:changed', url => {
                  cy.visit(url);
                  cy.get('#email').clear();
                  cy.get('#email').type("email2");
                  cy.contains("Update Record").click({ force: true });
                  cy.visit('http://localhost:3000');
                  cy.contains('email2').should('exist');
              });
       
        
        
      });*/
    });