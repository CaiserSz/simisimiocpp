import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true for 465, false for other ports
  auth: {
    user: config.email.username,
    pass: config.email.password,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    logger.error('Error with email configuration:', error);
  } else {
    logger.info('Email server is ready to send emails');
  }
});

// Read email templates
const readTemplate = (templateName) => {
  try {
    const templatePath = join(__dirname, `../../templates/emails/${templateName}.html`);
    return readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger.error(`Error reading email template ${templateName}:`, error);
    return null;
  }
};

// Compile email template with data
const compileTemplate = (template, data = {}) => {
  let compiledTemplate = template;
  
  // Replace placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledTemplate = compiledTemplate.replace(regex, value || '');
  });
  
  return compiledTemplate;
};

// Send email
const sendEmail = async (options) => {
  try {
    // In development, log the email instead of sending it
    if (process.env.NODE_ENV === 'development') {
      logger.info('Email not sent in development mode. Email details:', {
        to: options.email,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });
      return { success: true, message: 'Email logged (not sent in development)' };
    }
    
    // Read the email template
    const template = readTemplate(options.template);
    if (!template) {
      throw new Error(`Email template ${options.template} not found`);
    }
    
    // Compile the template with provided data
    const html = compileTemplate(template, options.context);
    
    // Define email options
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
      to: options.email,
      subject: options.subject,
      html,
      text: options.text || html.replace(/<[^>]*>?/gm, ''), // Fallback text version
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Email templates
const emailTemplates = {
  // Welcome email template
  welcome: {
    subject: 'Welcome to Our EV Charging Network',
    template: 'welcome',
  },
  
  // Password reset template
  passwordReset: {
    subject: 'Your Password Reset Token (valid for 10 min)',
    template: 'password-reset',
  },
  
  // Email verification template
  emailVerification: {
    subject: 'Verify Your Email Address',
    template: 'email-verification',
  },
  
  // Transaction receipt template
  transactionReceipt: {
    subject: 'Your Charging Session Receipt',
    template: 'transaction-receipt',
  },
};

export { sendEmail, emailTemplates };

// Example usage:
/*
sendEmail({
  email: 'user@example.com',
  subject: 'Test Email',
  template: 'welcome',
  context: {
    name: 'John Doe',
    resetUrl: 'https://example.com/reset-password/12345',
  },
});
*/
