const nodemailer = require('nodemailer');

// Support both naming conventions for env vars
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
const NOTIFY_EMAIL = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_NOTIFICATION_TO || SMTP_USER;

// Create reusable transporter
const createTransporter = () => {
    const port = parseInt(process.env.SMTP_PORT) || 465;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
};

/**
 * Send email notification
 */
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!SMTP_USER || !SMTP_PASS) {
            console.log('📧 Email not configured. Skipping notification.');
            console.log('📧 SMTP_USER:', SMTP_USER ? 'SET' : 'MISSING');
            console.log('📧 SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: `"UYNM Website" <${SMTP_USER}>`,
            to: to || NOTIFY_EMAIL,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send contact form notification to admin
 */
const sendContactNotification = async (contactData) => {
    const { firstName, lastName, email, subject, message } = contactData;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; border-bottom: 2px solid #1a5f2a; padding-bottom: 10px;">Contact Details</h2>
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="background: white; padding: 15px; border-left: 4px solid #1a5f2a; margin-top: 20px;">
                    <h3 style="margin-top: 0; color: #1a5f2a;">Message:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">United Youth Nigeria Movement - Website Notification</p>
            </div>
        </div>
    `;

    return sendEmail({
        subject: `[UYNM Contact] ${subject}`,
        html
    });
};

/**
 * Send new member registration notification
 */
const sendMemberNotification = async (memberData) => {
    const { fullName, email, phone, location, involvementTrack, reason } = memberData;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a5f2a 0%, #d4af37 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">New Member Registration</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">Member Details</h2>
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Involvement Track:</strong> <span style="background: #1a5f2a; color: white; padding: 3px 10px; border-radius: 15px;">${involvementTrack}</span></p>
                <div style="background: white; padding: 15px; border-left: 4px solid #d4af37; margin-top: 20px;">
                    <h3 style="margin-top: 0; color: #1a5f2a;">Reason for Joining:</h3>
                    <p style="white-space: pre-wrap;">${reason || 'Not provided'}</p>
                </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">United Youth Nigeria Movement - Website Notification</p>
            </div>
        </div>
    `;

    return sendEmail({
        subject: `[UYNM] New ${involvementTrack} Registration: ${fullName}`,
        html
    });
};

/**
 * Send newsletter subscription notification to admin
 */
const sendNewsletterNotification = async (email) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">New Newsletter Subscription</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; border-bottom: 2px solid #1a5f2a; padding-bottom: 10px;">Subscriber Details</h2>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <div style="background: white; padding: 15px; border-left: 4px solid #1a5f2a; margin-top: 20px;">
                    <p style="margin: 0; color: #666;">A new user has subscribed to the UYNM newsletter.</p>
                </div>
            </div>
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">United Youth Nigeria Movement - Website Notification</p>
            </div>
        </div>
    `;

    return sendEmail({
        subject: `[UYNM Newsletter] New Subscription: ${email}`,
        html
    });
};

module.exports = {
    sendEmail,
    sendContactNotification,
    sendMemberNotification,
    sendNewsletterNotification
};
