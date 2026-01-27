import { Router } from 'express';
import { createRequest, getAllRequests, getRequestById, getRequestStats, } from '../controllers/requestController.js';
import { verifyToken, approveRequest, rejectRequest, } from '../controllers/approvalController.js';
import { getAllApprovers, createApprover, updateApprover, deleteApprover, } from '../controllers/approverController.js';
import { handleWhatsAppWebhook } from '../controllers/webhookController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import multer from 'multer';
import authRoutes from './auth.routes.js';
import { notifyRequester } from '../services/twilioService.js';
// import path from 'node:path';
// import express from 'express';
// import { fileURLToPath } from 'url';
const router = Router();
// For ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
router.use('/auth', authRoutes);
// Cash Request Routes
const upload = multer({ dest: 'uploads/' });
router.post('/requests', upload.array('supportingDocuments'), createRequest);
// router.use('/uploads', express.static(path.join(__dirname, '../uploads')));
router.get('/requests', getAllRequests);
router.get('/requests/stats', getRequestStats);
router.get('/requests/:id', getRequestById);
// Approval Routes (via link with token)
router.get('/approve/verify/:token', verifyToken);
router.post('/approve/:token', approveRequest);
router.post('/reject/:token', rejectRequest);
// Dashboard approval routes (requires auth)
router.post('/requests/:requestId/approved', authMiddleware, async (req, res) => {
    const { requestId } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id; // ✅ Use ID from JWT
    try {
        const { CashRequest } = await import('../models/CashRequest.js');
        const { Approver } = await import('../models/Approver.js');
        const { sendApprovalConfirmation } = await import('../services/twilioService.js');
        const request = await CashRequest.findOne({ requestId });
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request already processed' });
            return;
        }
        const approver = await Approver.findOne({ _id: approverId, isActive: true }); // ✅ Find by _id
        if (!approver) {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        request.status = 'approved';
        request.approvedBy = {
            approverId: approver._id,
            approverName: approver.name,
            approverPhone: approver.phone,
            approvedAt: new Date(),
            comment: comment || '',
        };
        await request.save();
        // Notify approver (confirmation)
        await sendApprovalConfirmation(approver.phone, requestId, 'approved', request.requestingOfficer);
        // Notify requester
        if (request.requesterPhone) {
            await notifyRequester(request.requesterPhone, request.requestId, 'approved', approver.name);
        }
        res.json({ success: true, message: 'Request approved successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/requests/:requestId/rejected', authMiddleware, async (req, res) => {
    const { requestId } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id; // ✅ Use ID from JWT
    if (!comment) {
        res.status(400).json({ success: false, message: 'Rejection reason required' });
        return;
    }
    try {
        const { CashRequest } = await import('../models/CashRequest.js');
        const { Approver } = await import('../models/Approver.js');
        const { sendApprovalConfirmation } = await import('../services/twilioService.js');
        const request = await CashRequest.findOne({ requestId });
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request already processed' });
            return;
        }
        const approver = await Approver.findOne({ _id: approverId, isActive: true }); // ✅ Find by _id
        if (!approver) {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        request.status = 'rejected';
        request.rejectedBy = {
            approverId: approver._id,
            approverName: approver.name,
            approverPhone: approver.phone,
            rejectedAt: new Date(),
            reason: comment,
        };
        await request.save();
        // Notify approver (confirmation)
        await sendApprovalConfirmation(approver.phone, requestId, 'rejected', request.requestingOfficer);
        // Notify requester
        if (request.requesterPhone) {
            await notifyRequester(request.requesterPhone, request.requestId, 'rejected', approver.name);
        }
        res.json({ success: true, message: 'Request rejected successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// Approver Management Routes
router.get('/approvers', getAllApprovers);
router.post('/approvers', createApprover);
router.put('/approvers/:id', updateApprover);
router.delete('/approvers/:id', deleteApprover);
// WhatsApp Webhook
router.post('/webhook/whatsapp', handleWhatsAppWebhook);
export default router;
//# sourceMappingURL=index.js.map