import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
const formatPhoneForWhatsApp = (phone) => {
    let formatted = phone.replace(/\s+/g, '');
    if (formatted.startsWith('0')) {
        formatted = '+233' + formatted.substring(1);
    }
    else if (!formatted.startsWith('+')) {
        formatted = '+233' + formatted;
    }
    return `whatsapp:${formatted}`;
};
export const sendWhatsAppOTP = async (phone, otp) => {
    const message = `🔐 *Fresh Drops Approval Login*

Your One-Time Password (OTP) is:

👉 *${otp}*

⏳ This code expires in *5 minutes*.

If you did not request this login, please ignore this message.

🏭 Fresh Drops Water Factory`;
    try {
        await client.messages.create({
            from: config.twilioWhatsAppFrom,
            to: formatPhoneForWhatsApp(phone),
            body: message,
        });
        console.log(`✅ OTP sent to ${phone}`);
    }
    catch (error) {
        console.error('❌ Failed to send OTP:', error);
        throw error;
    }
};
export const generateApprovalToken = (requestId, approverPhone) => {
    return jwt.sign({ requestId, approverPhone }, config.jwtSecret, { expiresIn: '7d' });
};
export const verifyApprovalToken = (token) => {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === 'object' && decoded !== null && 'requestId' in decoded && 'approverPhone' in decoded) {
        return decoded;
    }
    throw new Error('Invalid token payload');
};
export const sendApprovalRequest = async (notification) => {
    const token = generateApprovalToken(notification.requestId, notification.approverPhone);
    const approvalLink = `${config.frontendUrl}/approve/${token}`;
    // Format file links if any
    let docsMessage = '';
    if (notification.supportingDocuments && notification.supportingDocuments.length > 0) {
        docsMessage = '\n📎 *Supporting Documents:*\n';
        notification.supportingDocuments.forEach(doc => {
            docsMessage += `- ${doc.name}: ${doc.url}\n`;
        });
    }
    const message = `🏭 *Fresh Drops Water Factory*
💰 *Cash Request Approval*

📋 *Request ID:* ${notification.requestId}
👤 *Requesting Officer:* ${notification.requestingOfficer}
🏢 *Department:* ${notification.department}
💵 *Amount:* GH₵ ${notification.amount.toLocaleString()}
📅 *Payment Day:* ${notification.paymentDay}

📝 *Purpose:* ${notification.purpose}
${docsMessage}
━━━━━━━━━━━━━━━━━━━━
*To Approve or Reject:*

✅ *Reply:* APPROVE ${notification.requestId}
❌ *Reply:* REJECT ${notification.requestId} [reason]

🔗 *Or click:* ${approvalLink}

⏰ Submitted: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' })}`;
    try {
        await client.messages.create({
            from: config.twilioWhatsAppFrom,
            to: formatPhoneForWhatsApp(notification.approverPhone),
            body: message,
        });
        console.log(`✅ WhatsApp sent to ${notification.approverPhone}`);
    }
    catch (error) {
        console.error('❌ Failed to send WhatsApp:', error);
        throw error;
    }
};
export const sendApprovalConfirmation = async (phone, requestId, action, requester) => {
    const emoji = action === 'approved' ? '✅' : '❌';
    const message = `${emoji} *Request ${action.toUpperCase()}*

Request ID: ${requestId}
Requesting Officer: ${requester}

You have just  ${action} a request.
${action === 'approved' ? 'Payment will be processed on the scheduled payment day.' : 'The requester has been notified.'}

🏭 Fresh Drops Water Factory`;
    try {
        await client.messages.create({
            from: config.twilioWhatsAppFrom,
            to: formatPhoneForWhatsApp(phone),
            body: message,
        });
    }
    catch (error) {
        console.error('❌ Failed to send confirmation:', error);
    }
};
export const notifyRequester = async (phone, requestId, action, approverOrComment) => {
    let message = '';
    if (action === 'submitted') {
        message = `📌 *Your Cash Request has been submitted*

Request ID: ${requestId}

You will be notified once it is approved or rejected.

🏭 Fresh Drops Water Factory`;
    }
    else if (action === 'approved') {
        message = `✅ *Your Cash Request has been approved*

Request ID: ${requestId}
Approved by: ${approverOrComment}

✓ Payment will be processed on the scheduled day.

🏭 Fresh Drops Water Factory`;
    }
    else if (action === 'rejected') {
        message = `❌ *Your Cash Request has been rejected*

Request ID: ${requestId}
Rejected by: ${approverOrComment}

✗ Please contact the approver for more details.

🏭 Fresh Drops Water Factory`;
    }
    try {
        await client.messages.create({
            from: config.twilioWhatsAppFrom,
            to: formatPhoneForWhatsApp(phone),
            body: message,
        });
        console.log(`✅ WhatsApp sent to requester ${phone}`);
    }
    catch (error) {
        console.error('❌ Failed to notify requester:', error);
    }
};
//# sourceMappingURL=twilioService.js.map