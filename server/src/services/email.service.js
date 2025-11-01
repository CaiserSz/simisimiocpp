const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../utils/logger');
const config = require('../config/config');

const logger = createLogger('email-service');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the email service
   */
  async init() {
    if (this.initialized) return;

    try {
      // Create test account if in development
      if (process.env.NODE_ENV === 'development' && !config.email.host) {
        logger.info('Creating test email account...');
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        logger.info(`Test email account created: ${testAccount.user}`);
        logger.info(`Ethereal URL: https://ethereal.email/message/${testAccount.messageId}`);
      } else {
        // Production email configuration
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.password,
          },
          tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: config.env !== 'production',
          },
        });
        
        // Verify connection configuration
        await this.verifyConnection();
      }

      // Load email templates
      await this.loadTemplates();
      
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      const isVerified = await this.transporter.verify();
      if (isVerified) {
        logger.info('SMTP connection verified');
      }
      return isVerified;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      throw error;
    }
  }

  /**
   * Load email templates from the templates directory
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/email');
      const templateFiles = (await fs.readdir(templatesDir))
        .filter(file => file.endsWith('.js') && file !== 'index.js');
      
      for (const file of templateFiles) {
        const templateName = path.basename(file, '.js');
        const template = require(path.join(templatesDir, file));
        this.templates.set(templateName, template);
        logger.debug(`Loaded email template: ${templateName}`);
      }
      
      logger.info(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      logger.error('Failed to load email templates:', error);
      throw error;
    }
  }

  /**
   * Get an email template by name
   * @param {string} templateName - Name of the template
   * @returns {Function} Template function
   */
  getTemplate(templateName) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    return template;
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email address(es)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text email content
   * @param {string} options.html - HTML email content
   * @param {Object} [options.context] - Template context
   * @param {string} [options.template] - Template name
   * @param {Object} [options.attachments] - Email attachments
   * @returns {Promise<Object>} Email send result
   */
  async sendEmail({
    to,
    subject,
    text,
    html,
    context = {},
    template,
    attachments,
  } = {}) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // If template is provided, render it
      if (template) {
        const templateFn = this.getTemplate(template);
        const rendered = templateFn({
          ...context,
          appName: config.app.name,
          supportEmail: config.email.supportEmail,
          currentYear: new Date().getFullYear(),
        });
        
        subject = rendered.subject || subject;
        text = rendered.text || text;
        html = rendered.html || html;
      }

      // Prepare email options
      const mailOptions = {
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject || 'No Subject',
        text: text || '',
        html: html || text || '',
        attachments,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log email info (without sensitive data)
      const logInfo = { ...info };
      delete logInfo.envelope;
      delete logInfo.message;
      
      logger.debug('Email sent:', {
        messageId: info.messageId,
        envelope: info.envelope,
        previewUrl: nodemailer.getTestMessageUrl(info),
      });
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email address
   * @param {string} name - Recipient name
   * @param {string} resetLink - Password reset link
   * @param {string} [expiresIn='1 hour'] - Expiration time
   * @returns {Promise<Object>} Email send result
   */
  async sendPasswordResetEmail(to, name, resetLink, expiresIn = '1 hour') {
    return this.sendEmail({
      to,
      template: 'reset-password',
      context: {
        name,
        resetLink,
        expiresIn,
      },
    });
  }

  /**
   * Send an email verification email
   * @param {string} to - Recipient email address
   * @param {string} name - Recipient name
   * @param {string} verificationLink - Email verification link
   * @param {string} [expiresIn='24 hours'] - Expiration time
   * @returns {Promise<Object>} Email send result
   */
  async sendVerificationEmail(to, name, verificationLink, expiresIn = '24 hours') {
    return this.sendEmail({
      to,
      template: 'verify-email',
      context: {
        name,
        verificationLink,
        expiresIn,
      },
    });
  }

  /**
   * Close the email transporter
   */
  async close() {
    if (this.transporter) {
      await this.transporter.close();
      this.initialized = false;
      logger.info('Email service closed');
    }
  }
}

// Create a singleton instance
const emailService = new EmailService();

// Handle process exit
process.on('SIGTERM', async () => {
  await emailService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await emailService.close();
  process.exit(0);
});

module.exports = emailService;
