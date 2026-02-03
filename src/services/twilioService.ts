import twilio from "twilio";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

interface ApprovalNotification {
  requestId: string;
  requestingOfficer: string;
  purpose: string;
  amount: number;
  paymentDay: string;
  department: string;
  approverPhone: string;
}

interface SupportingDocument {
  name: string;
  filename: string;
  url: string;
}

const formatPhoneForWhatsApp = (phone: string): string => {
  let formatted = phone.replace(/\s+/g, "");

  if (formatted.startsWith("0")) {
    formatted = "+233" + formatted.substring(1);
  } else if (!formatted.startsWith("+")) {
    formatted = "+233" + formatted;
  }

  return `whatsapp:${formatted}`;
};

const formatPhoneForSMS = (phone: string): string => {
  let formatted = phone.replace(/\s+/g, "");

  if (formatted.startsWith("0")) {
    formatted = "+233" + formatted.substring(1);
  } else if (!formatted.startsWith("+")) {
    formatted = "+233" + formatted;
  }

  return formatted;
};

/**
 * ✅ DUAL DELIVERY:
 * - Always tries WhatsApp
 * - Always tries SMS
 * - Logs whether SMS was fallback or dual
 */
const sendWhatsAppWithSMSFallback = async (
  toPhone: string,
  message: string,
  logLabel: string,
): Promise<void> => {
  let whatsappSent = false;

  try {
    await client.messages.create({
      from: config.twilioWhatsAppFrom,
      to: formatPhoneForWhatsApp(toPhone),
      body: message,
    });

    whatsappSent = true;
    console.log(`✅ WhatsApp sent (${logLabel})`);
  } catch (waError) {
    console.error(`❌ WhatsApp failed (${logLabel})`, waError);
  }

  try {
    await client.messages.create({
      from: config.twilioSmsFrom,
      to: formatPhoneForSMS(toPhone),
      body: message,
    });

    console.log(
      `📩 SMS sent (${logLabel})${
        whatsappSent ? " (dual delivery)" : " (fallback)"
      }`,
    );
  } catch (smsError) {
    console.error(`❌ SMS failed (${logLabel})`, smsError);
  }
};

export const sendWhatsAppOTP = async (
  phone: string,
  otp: string,
): Promise<void> => {
  const message = `🔐 *Fresh Drops Approval Login*

Your One-Time Password (OTP) is:

👉 *${otp}*

⏳ This code expires in *5 minutes*.

If you did not request this login, please ignore this message.

🏭 Fresh Drops Water Factory`;

  await sendWhatsAppWithSMSFallback(phone, message, "OTP");
};

export const generateApprovalToken = (
  requestId: string,
  approverPhone: string,
): string => {
  return jwt.sign({ requestId, approverPhone }, config.jwtSecret, {
    expiresIn: "7d",
  });
};

export const verifyApprovalToken = (
  token: string,
): { requestId: string; approverPhone: string } => {
  const decoded = jwt.verify(token, config.jwtSecret);

  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "requestId" in decoded &&
    "approverPhone" in decoded
  ) {
    return decoded as {
      requestId: string;
      approverPhone: string;
    };
  }

  throw new Error("Invalid token payload");
};

export const sendApprovalRequest = async (
  notification: ApprovalNotification & {
    supportingDocuments?: SupportingDocument[];
  },
): Promise<void> => {
  const token = generateApprovalToken(
    notification.requestId,
    notification.approverPhone,
  );

  const approvalLink = `${config.frontendUrl}/approve/${token}`;

  let docsMessage = "";
  if (
    notification.supportingDocuments &&
    notification.supportingDocuments.length > 0
  ) {
    docsMessage = "\n📎 *Supporting Documents:*\n";
    notification.supportingDocuments.forEach((doc) => {
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

⏰ Submitted: ${new Date().toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
  })}`;

  await sendWhatsAppWithSMSFallback(
    notification.approverPhone,
    message,
    "Approval Request",
  );
};

export const sendApprovalConfirmation = async (
  phone: string,
  requestId: string,
  action: "approved" | "rejected",
  requester: string,
): Promise<void> => {
  const emoji = action === "approved" ? "✅" : "❌";

  const message = `${emoji} *Request ${action.toUpperCase()}*

Request ID: ${requestId}
Requesting Officer: ${requester}

You have just ${action} a request.
${
  action === "approved"
    ? "Payment will be processed on the scheduled payment day."
    : "The requester has been notified."
}

🏭 Fresh Drops Water Factory`;

  await sendWhatsAppWithSMSFallback(
    phone,
    message,
    "Approval Confirmation",
  );
};

export const notifyRequester = async (
  phone: string,
  requestId: string,
  action: "submitted" | "approved" | "rejected",
  approverOrComment?: string,
): Promise<void> => {
  let message = "";

  if (action === "submitted") {
    message = `📌 *Your Cash Request has been submitted*

Request ID: ${requestId}

You will be notified once it is approved or rejected.

🏭 Fresh Drops Water Factory`;
  } else if (action === "approved") {
    message = `✅ *Your Cash Request has been approved*

Request ID: ${requestId}
Approved by: ${approverOrComment}

✓ Payment will be processed on the scheduled day.

🏭 Fresh Drops Water Factory`;
  } else if (action === "rejected") {
    message = `❌ *Your Cash Request has been rejected*

Request ID: ${requestId}
Rejected by: ${approverOrComment}

✗ Please contact the approver for more details.

🏭 Fresh Drops Water Factory`;
  }

  await sendWhatsAppWithSMSFallback(
    phone,
    message,
    "Requester Notification",
  );
};
