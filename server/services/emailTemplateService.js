const logger = require('../utils/logger');

class EmailTemplateService {
  constructor() {
    this.templates = {
      LENDING_CONFIRMATION: 'lending_confirmation',
      RETURN_REMINDER: 'return_reminder',
      OVERDUE_NOTICE: 'overdue_notice',
      RETURN_CONFIRMATION: 'return_confirmation',
      LENDING_REQUEST_APPROVAL: 'lending_request_approval',
    };
  }

  generateTemplate(templateType, data) {
    switch (templateType) {
      case this.templates.LENDING_CONFIRMATION:
        return this.generateLendingConfirmation(data);
      case this.templates.RETURN_REMINDER:
        return this.generateReturnReminder(data);
      case this.templates.OVERDUE_NOTICE:
        return this.generateOverdueNotice(data);
      case this.templates.RETURN_CONFIRMATION:
        return this.generateReturnConfirmation(data);
      case this.templates.LENDING_REQUEST_APPROVAL:
        return this.generateLendingRequestApproval(data);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  generateLendingConfirmation(data) {
    const {
      borrowerName,
      productName,
      lendDate,
      dueDate,
      productSpecs,
      lendingId,
    } = data;

    return {
      subject: `Lending Confirmation - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Lending Confirmation</h2>
            
            <p>Dear ${borrowerName},</p>
            
            <p>This confirms that you have successfully borrowed the following item:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">${productName}</h3>
              ${productSpecs ? `<p><strong>Specifications:</strong> ${productSpecs}</p>` : ''}
              <p><strong>Lending Date:</strong> ${new Date(lendDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
              <p><strong>Lending ID:</strong> ${lendingId}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin-top: 0;">Important Reminders:</h4>
              <ul style="color: #856404;">
                <li>Please return the item by the due date to avoid overdue notices</li>
                <li>You will receive a reminder 3 days before the due date</li>
                <li>Report any damage or issues immediately</li>
                <li>Keep this confirmation for your records</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">Thank you for using our lending system!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Lending Confirmation
        
        Dear ${borrowerName},
        
        This confirms that you have successfully borrowed: ${productName}
        ${productSpecs ? `Specifications: ${productSpecs}` : ''}
        Lending Date: ${new Date(lendDate).toLocaleDateString()}
        Due Date: ${new Date(dueDate).toLocaleDateString()}
        Lending ID: ${lendingId}
        
        Important Reminders:
        - Please return the item by the due date to avoid overdue notices
        - You will receive a reminder 3 days before the due date
        - Report any damage or issues immediately
        - Keep this confirmation for your records
        
        Thank you for using our lending system!
      `,
    };
  }

  generateReturnReminder(data) {
    const { borrowerName, productName, dueDate, daysUntilDue, lendingId } =
      data;

    return {
      subject: `Return Reminder - ${productName} due in ${daysUntilDue} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Return Reminder</h2>
            
            <p>Dear ${borrowerName},</p>
            
            <p>This is a friendly reminder that the following item is due for return:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">${productName}</h3>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
              <p><strong>Days Until Due:</strong> ${daysUntilDue}</p>
              <p><strong>Lending ID:</strong> ${lendingId}</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8;">
              <h4 style="color: #0c5460; margin-top: 0;">Next Steps:</h4>
              <ul style="color: #0c5460;">
                <li>Please return the item by the due date</li>
                <li>Check the item for any damage before returning</li>
                <li>Contact us if you need an extension</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">Thank you for your cooperation!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated reminder. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Return Reminder
        
        Dear ${borrowerName},
        
        This is a friendly reminder that the following item is due for return:
        
        ${productName}
        Due Date: ${new Date(dueDate).toLocaleDateString()}
        Days Until Due: ${daysUntilDue}
        Lending ID: ${lendingId}
        
        Next Steps:
        - Please return the item by the due date
        - Check the item for any damage before returning
        - Contact us if you need an extension
        
        Thank you for your cooperation!
      `,
    };
  }

  generateOverdueNotice(data) {
    const { borrowerName, productName, dueDate, daysOverdue, lendingId } = data;

    return {
      subject: `OVERDUE NOTICE - ${productName} (${daysOverdue} days overdue)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ OVERDUE NOTICE</h2>
            
            <p>Dear ${borrowerName},</p>
            
            <p><strong>The following item is now overdue and must be returned immediately:</strong></p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="color: #dc3545; margin-top: 0;">${productName}</h3>
              <p><strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
              <p><strong>Lending ID:</strong> ${lendingId}</p>
            </div>
            
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
              <h4 style="color: #721c24; margin-top: 0;">IMMEDIATE ACTION REQUIRED:</h4>
              <ul style="color: #721c24;">
                <li>Return the item immediately to avoid further penalties</li>
                <li>Contact us if there are any issues preventing return</li>
                <li>Late fees may apply for extended overdue periods</li>
                <li>Failure to return may result in replacement charges</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; font-weight: bold;">Please contact us immediately if you have any questions or concerns.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated overdue notice. Please contact us to resolve this matter.
            </p>
          </div>
        </div>
      `,
      text: `
        ⚠️ OVERDUE NOTICE
        
        Dear ${borrowerName},
        
        The following item is now overdue and must be returned immediately:
        
        ${productName}
        Original Due Date: ${new Date(dueDate).toLocaleDateString()}
        Days Overdue: ${daysOverdue}
        Lending ID: ${lendingId}
        
        IMMEDIATE ACTION REQUIRED:
        - Return the item immediately to avoid further penalties
        - Contact us if there are any issues preventing return
        - Late fees may apply for extended overdue periods
        - Failure to return may result in replacement charges
        
        Please contact us immediately if you have any questions or concerns.
      `,
    };
  }

  generateReturnConfirmation(data) {
    const { borrowerName, productName, returnDate, condition, lendingId } =
      data;

    return {
      subject: `Return Confirmation - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #28a745; margin-bottom: 20px;">✅ Return Confirmation</h2>
            
            <p>Dear ${borrowerName},</p>
            
            <p>Thank you for returning the following item:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">${productName}</h3>
              <p><strong>Return Date:</strong> ${new Date(returnDate).toLocaleDateString()}</p>
              <p><strong>Condition:</strong> ${condition}</p>
              <p><strong>Lending ID:</strong> ${lendingId}</p>
            </div>
            
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
              <p style="color: #155724; margin: 0;">
                <strong>Return processed successfully!</strong> The item is now available for other users.
              </p>
            </div>
            
            <p style="margin-top: 20px;">Thank you for using our lending system responsibly!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated confirmation. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        ✅ Return Confirmation
        
        Dear ${borrowerName},
        
        Thank you for returning the following item:
        
        ${productName}
        Return Date: ${new Date(returnDate).toLocaleDateString()}
        Condition: ${condition}
        Lending ID: ${lendingId}
        
        Return processed successfully! The item is now available for other users.
        
        Thank you for using our lending system responsibly!
      `,
    };
  }

  generateLendingRequestApproval(data) {
    const { borrowerName, productName, approverName, lendingId } = data;

    return {
      subject: `Lending Request Approved - ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #28a745; margin-bottom: 20px;">✅ Lending Request Approved</h2>
            
            <p>Dear ${borrowerName},</p>
            
            <p>Your lending request has been approved:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">${productName}</h3>
              <p><strong>Approved by:</strong> ${approverName}</p>
              <p><strong>Lending ID:</strong> ${lendingId}</p>
            </div>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8;">
              <h4 style="color: #0c5460; margin-top: 0;">Next Steps:</h4>
              <ul style="color: #0c5460;">
                <li>You can now proceed to collect the item</li>
                <li>Please bring a valid ID for verification</li>
                <li>You will receive a lending confirmation once the item is collected</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px;">Thank you for using our lending system!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #6c757d;">
              This is an automated approval notification. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
        ✅ Lending Request Approved
        
        Dear ${borrowerName},
        
        Your lending request has been approved:
        
        ${productName}
        Approved by: ${approverName}
        Lending ID: ${lendingId}
        
        Next Steps:
        - You can now proceed to collect the item
        - Please bring a valid ID for verification
        - You will receive a lending confirmation once the item is collected
        
        Thank you for using our lending system!
      `,
    };
  }
}

module.exports = new EmailTemplateService();
