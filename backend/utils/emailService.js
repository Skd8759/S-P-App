const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    const transporter = createTransporter();
    
    const subject = type === 'verification' 
      ? 'NITK Swimming Pool - Email Verification OTP'
      : 'NITK Swimming Pool - Password Reset OTP';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">NITK Swimming Pool</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Booking System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">
            ${type === 'verification' ? 'Email Verification' : 'Password Reset'}
          </h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ${type === 'verification' 
              ? 'Thank you for registering with NITK Swimming Pool Booking System. Please verify your email address using the OTP below:'
              : 'You have requested to reset your password. Use the OTP below to reset your password:'
            }
          </p>
          
          <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> This OTP is valid for 10 minutes only. Do not share this OTP with anyone.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Note:</strong> NITK Swimming Pool will never ask for your OTP or password via email or phone.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2024 NITK Swimming Pool Booking System. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"NITK Swimming Pool" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (email, bookingDetails) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">NITK Swimming Pool</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Booking Confirmation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #28a745; margin-bottom: 20px;">✅ Booking Confirmed!</h2>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${new Date(bookingDetails.date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${bookingDetails.startTime} - ${bookingDetails.endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Gender:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${bookingDetails.gender}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${bookingDetails.isRaisingCourt ? 'Raising Court' : 'Swimming Pool'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Booking ID:</strong></td>
                <td style="padding: 8px 0;">${bookingDetails.bookingId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin-top: 20px;">
            <h4 style="color: #0c5460; margin-top: 0;">Important Reminders:</h4>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
              <li>Please arrive 10 minutes before your scheduled time</li>
              <li>Bring your student/staff ID for verification</li>
              <li>Follow all pool safety guidelines</li>
              <li>You can cancel your booking up to 2 hours before the slot</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2024 NITK Swimming Pool Booking System. All rights reserved.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"NITK Swimming Pool" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'NITK Swimming Pool - Booking Confirmation',
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendBookingConfirmation
};
