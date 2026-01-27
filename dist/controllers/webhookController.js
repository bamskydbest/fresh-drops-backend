import { CashRequest } from '../models/CashRequest.js';
import { Approver } from '../models/Approver.js';
import { sendApprovalConfirmation } from '../services/twilioService.js';
const parseWhatsAppMessage = (body) => {
    const text = body.trim().toUpperCase();
    // Match APPROVE REQ-YYYYMMDD-XXX
    const approveMatch = text.match(/^APPROVE\s+(REQ-\d{8}-\d{3})/);
    if (approveMatch) {
        return { action: 'approve', requestId: approveMatch[1] };
    }
    // Match REJECT REQ-YYYYMMDD-XXX reason
    const rejectMatch = text.match(/^REJECT\s+(REQ-\d{8}-\d{3})\s+(.+)/);
    if (rejectMatch) {
        return { action: 'reject', requestId: rejectMatch[1], reason: rejectMatch[2].trim() };
    }
    return { action: null, requestId: null };
};
const normalizePhone = (phone) => {
    // Remove whatsapp: prefix if present
    let normalized = phone.replace('whatsapp:', '');
    // Convert to Ghana format - keep the +233 format for matching
    if (!normalized.startsWith('+')) {
        if (normalized.startsWith('233')) {
            normalized = '+' + normalized;
        }
        else if (normalized.startsWith('0')) {
            normalized = '+233' + normalized.substring(1);
        }
    }
    return normalized;
};
export const handleWhatsAppWebhook = async (req, res) => {
    try {
        const { Body, From } = req.body;
        console.log('📨 Incoming WhatsApp:', { Body, From });
        if (!Body || !From) {
            res.status(200).send('OK');
            return;
        }
        const fromPhone = normalizePhone(From);
        const parsed = parseWhatsAppMessage(Body);
        console.log('📋 Parsed:', { fromPhone, parsed });
        if (!parsed.action || !parsed.requestId) {
            console.log('⚠️ Invalid command format');
            res.status(200).send('OK');
            return;
        }
        // Find the approver - check both phone formats
        const approver = await Approver.findOne({
            phone: { $in: [fromPhone, fromPhone.replace('+233', '0')] },
            isActive: true
        });
        if (!approver) {
            console.log('❌ Approver not found:', fromPhone);
            res.status(200).send('OK');
            return;
        }
        console.log('✅ Approver found:', approver.name);
        // Find the request
        const request = await CashRequest.findOne({ requestId: parsed.requestId });
        if (!request) {
            console.log('❌ Request not found:', parsed.requestId);
            res.status(200).send('OK');
            return;
        }
        if (request.status !== 'pending') {
            console.log('⚠️ Request already processed:', request.status);
            res.status(200).send('OK');
            return;
        }
        // Process approval or rejection
        if (parsed.action === 'approve') {
            request.status = 'approved';
            request.approvedBy = {
                approverId: approver._id,
                approverName: approver.name,
                approverPhone: approver.phone,
                approvedAt: new Date(),
                comment: '',
            };
            await request.save();
            await sendApprovalConfirmation(approver.phone, request.requestId, 'approved', request.requestingOfficer);
            console.log('✅ Request approved:', parsed.requestId);
        }
        else if (parsed.action === 'reject') {
            if (!parsed.reason) {
                console.log('⚠️ Rejection reason missing');
                res.status(200).send('OK');
                return;
            }
            request.status = 'rejected';
            request.rejectedBy = {
                approverId: approver._id,
                approverName: approver.name,
                approverPhone: approver.phone,
                rejectedAt: new Date(),
                reason: parsed.reason,
            };
            await request.save();
            await sendApprovalConfirmation(approver.phone, request.requestId, 'rejected', request.requestingOfficer);
            console.log('✅ Request rejected:', parsed.requestId);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(200).send('OK');
    }
};
//# sourceMappingURL=webhookController.js.map