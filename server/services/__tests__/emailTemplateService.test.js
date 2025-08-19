const emailTemplateService = require('../emailTemplateService');

describe('EmailTemplateService', () => {
  describe('generateTemplate', () => {
    it('should generate lending confirmation template', () => {
      const data = {
        borrowerName: 'John Doe',
        productName: 'MacBook Pro',
        lendDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        productSpecs: 'M1 Pro, 16GB RAM, 512GB SSD',
        lendingId: 'LT-001',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.LENDING_CONFIRMATION,
        data
      );

      expect(template.subject).toBe('Lending Confirmation - MacBook Pro');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('MacBook Pro');
      expect(template.html).toContain('M1 Pro, 16GB RAM, 512GB SSD');
      expect(template.html).toContain('LT-001');
      expect(template.text).toContain('John Doe');
      expect(template.text).toContain('MacBook Pro');
    });

    it('should generate return reminder template', () => {
      const data = {
        borrowerName: 'Jane Smith',
        productName: 'iPad Pro',
        dueDate: new Date('2024-02-20'),
        daysUntilDue: 3,
        lendingId: 'LT-002',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.RETURN_REMINDER,
        data
      );

      expect(template.subject).toBe('Return Reminder - iPad Pro due in 3 days');
      expect(template.html).toContain('Jane Smith');
      expect(template.html).toContain('iPad Pro');
      expect(template.html).toContain('3');
      expect(template.html).toContain('LT-002');
      expect(template.text).toContain('Jane Smith');
      expect(template.text).toContain('iPad Pro');
    });

    it('should generate overdue notice template', () => {
      const data = {
        borrowerName: 'Bob Johnson',
        productName: 'Dell Monitor',
        dueDate: new Date('2024-01-10'),
        daysOverdue: 5,
        lendingId: 'LT-003',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.OVERDUE_NOTICE,
        data
      );

      expect(template.subject).toBe(
        'OVERDUE NOTICE - Dell Monitor (5 days overdue)'
      );
      expect(template.html).toContain('Bob Johnson');
      expect(template.html).toContain('Dell Monitor');
      expect(template.html).toContain('5');
      expect(template.html).toContain('LT-003');
      expect(template.html).toContain('⚠️ OVERDUE NOTICE');
      expect(template.text).toContain('⚠️ OVERDUE NOTICE');
    });

    it('should generate return confirmation template', () => {
      const data = {
        borrowerName: 'Alice Brown',
        productName: 'Wireless Mouse',
        returnDate: new Date('2024-02-10'),
        condition: 'excellent',
        lendingId: 'LT-004',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.RETURN_CONFIRMATION,
        data
      );

      expect(template.subject).toBe('Return Confirmation - Wireless Mouse');
      expect(template.html).toContain('Alice Brown');
      expect(template.html).toContain('Wireless Mouse');
      expect(template.html).toContain('excellent');
      expect(template.html).toContain('LT-004');
      expect(template.html).toContain('✅ Return Confirmation');
      expect(template.text).toContain('✅ Return Confirmation');
    });

    it('should generate lending request approval template', () => {
      const data = {
        borrowerName: 'Charlie Wilson',
        productName: 'Conference Camera',
        approverName: 'Admin User',
        lendingId: 'LT-005',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.LENDING_REQUEST_APPROVAL,
        data
      );

      expect(template.subject).toBe(
        'Lending Request Approved - Conference Camera'
      );
      expect(template.html).toContain('Charlie Wilson');
      expect(template.html).toContain('Conference Camera');
      expect(template.html).toContain('Admin User');
      expect(template.html).toContain('LT-005');
      expect(template.html).toContain('✅ Lending Request Approved');
      expect(template.text).toContain('✅ Lending Request Approved');
    });

    it('should throw error for unknown template type', () => {
      const data = { borrowerName: 'Test User' };

      expect(() => {
        emailTemplateService.generateTemplate('UNKNOWN_TEMPLATE', data);
      }).toThrow('Unknown template type: UNKNOWN_TEMPLATE');
    });

    it('should handle missing optional data gracefully', () => {
      const data = {
        borrowerName: 'John Doe',
        productName: 'Test Product',
        lendDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        lendingId: 'LT-001',
        // productSpecs is missing
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.LENDING_CONFIRMATION,
        data
      );

      expect(template.subject).toBe('Lending Confirmation - Test Product');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('Test Product');
      expect(template.html).not.toContain('Specifications:');
    });

    it('should format dates correctly in templates', () => {
      const data = {
        borrowerName: 'John Doe',
        productName: 'Test Product',
        lendDate: new Date('2024-01-15T10:30:00Z'),
        dueDate: new Date('2024-02-15T15:45:00Z'),
        lendingId: 'LT-001',
      };

      const template = emailTemplateService.generateTemplate(
        emailTemplateService.templates.LENDING_CONFIRMATION,
        data
      );

      // Check that dates are formatted as locale date strings
      expect(template.html).toContain(
        new Date('2024-01-15T10:30:00Z').toLocaleDateString()
      );
      expect(template.html).toContain(
        new Date('2024-02-15T15:45:00Z').toLocaleDateString()
      );
      expect(template.text).toContain(
        new Date('2024-01-15T10:30:00Z').toLocaleDateString()
      );
      expect(template.text).toContain(
        new Date('2024-02-15T15:45:00Z').toLocaleDateString()
      );
    });
  });

  describe('template constants', () => {
    it('should have all required template types', () => {
      expect(emailTemplateService.templates.LENDING_CONFIRMATION).toBe(
        'lending_confirmation'
      );
      expect(emailTemplateService.templates.RETURN_REMINDER).toBe(
        'return_reminder'
      );
      expect(emailTemplateService.templates.OVERDUE_NOTICE).toBe(
        'overdue_notice'
      );
      expect(emailTemplateService.templates.RETURN_CONFIRMATION).toBe(
        'return_confirmation'
      );
      expect(emailTemplateService.templates.LENDING_REQUEST_APPROVAL).toBe(
        'lending_request_approval'
      );
    });
  });
});
