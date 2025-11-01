/**
 * Password Reset Email Template
 * 
 * @param {Object} options - Email options
 * @param {string} options.name - User's name
 * @param {string} options.resetLink - Password reset link
 * @param {string} options.supportEmail - Support email address
 * @param {string} options.appName - Application name
 * @param {string} options.expiresIn - Expiration time (e.g., "1 hour")
 * @returns {Object} Email template with subject, text, and html
 */
module.exports = ({
  name = 'User',
  resetLink = '#',
  supportEmail = 'support@evcharging.com',
  appName = 'EV Charging Network',
  expiresIn = '1 hour'
} = {}) => {
  const year = new Date().getFullYear();
  
  // Text version of the email
  const text = `
    Hi ${name},
    
    You recently requested to reset your password for your ${appName} account. 
    Click the link below to reset it:
    
    ${resetLink}
    
    This link will expire in ${expiresIn}.
    
    If you didn't request this, please ignore this email or contact support if you have questions.
    
    Thanks,
    The ${appName} Team
    
    © ${year} ${appName}. All rights reserved.
    If you're having trouble with the button above, copy and paste the URL below into your web browser:
    ${resetLink}
  `;

  // HTML version of the email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1a73e8;
          padding: 20px 0;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header img {
          max-width: 180px;
          height: auto;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #1a73e8;
          margin-top: 0;
          font-size: 24px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1a73e8;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1557b0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #757575;
          text-align: center;
        }
        .code {
          font-family: monospace;
          background-color: #f5f5f5;
          padding: 10px 15px;
          border-radius: 4px;
          word-break: break-all;
          margin: 15px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
          }
          .content {
            padding: 15px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- Replace with your logo URL -->
          <img src="https://your-logo-url.com/logo-white.png" alt="${appName}" />
        </div>
        <div class="content">
          <h1>Reset Your Password</h1>
          
          <p>Hello ${name},</p>
          
          <p>We received a request to reset the password for your ${appName} account. 
          Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button" target="_blank">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in <strong>${expiresIn}</strong>.</p>
          
          <p>If you didn't request this, please ignore this email or contact our support team 
          if you have any questions.</p>
          
          <p>Thanks,<br>The ${appName} Team</p>
          
          <div class="footer">
            <p>© ${year} ${appName}. All rights reserved.</p>
            <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
            <div class="code">${resetLink}</div>
            <p>If you have any questions, please contact us at 
              <a href="mailto:${supportEmail}" style="color: #1a73e8;">${supportEmail}</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `Reset Your ${appName} Password`,
    text: text.replace(/^\s+/gm, '').trim(),
    html: html.replace(/^\s+/gm, '').trim()
  };
};
