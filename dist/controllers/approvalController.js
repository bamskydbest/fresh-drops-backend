import { CashRequest } from '../models/CashRequest.js';
import { Approver } from '../models/Approver.js';
import { verifyApprovalToken, sendApprovalConfirmation } from '../services/twilioService.js';
export const verifyToken = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = verifyApprovalToken(token);
        const request = await CashRequest.findOne({ requestId: decoded.requestId });
        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Request not found',
            });
            return;
        }
        const approver = await Approver.findOne({ phone: decoded.approverPhone });
        if (!approver || !approver.isActive) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized approver',
            });
            return;
        }
        res.json({
            success: true,
            data: {
                request,
                approver: {
                    name: approver.name,
                    position: approver.position,
                },
            },
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message,
        });
    }
};
export const approveRequest = async (req, res) => {
    try {
        const { token } = req.params;
        const { comment } = req.body;
        const decoded = verifyApprovalToken(token);
        const request = await CashRequest.findOne({ requestId: decoded.requestId });
        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Request not found',
            });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: `Request already ${request.status}`,
            });
            return;
        }
        const approver = await Approver.findOne({ phone: decoded.approverPhone });
        if (!approver || !approver.isActive) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized approver',
            });
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
        await sendApprovalConfirmation(approver.phone, request.requestId, 'approved', request.requestingOfficer);
        res.json({
            success: true,
            message: 'Request approved successfully',
            data: request,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to approve request',
            error: error.message,
        });
    }
};
export const rejectRequest = async (req, res) => {
    try {
        const { token } = req.params;
        const { reason } = req.body;
        if (!reason || reason.trim() === '') {
            res.status(400).json({
                success: false,
                message: 'Rejection reason is required',
            });
            return;
        }
        const decoded = verifyApprovalToken(token);
        const request = await CashRequest.findOne({ requestId: decoded.requestId });
        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Request not found',
            });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: `Request already ${request.status}`,
            });
            return;
        }
        const approver = await Approver.findOne({ phone: decoded.approverPhone });
        if (!approver || !approver.isActive) {
            res.status(403).json({
                success: false,
                message: 'Unauthorized approver',
            });
            return;
        }
        request.status = 'rejected';
        request.rejectedBy = {
            approverId: approver._id,
            approverName: approver.name,
            approverPhone: approver.phone,
            rejectedAt: new Date(),
            reason: reason.trim(),
        };
        await request.save();
        await sendApprovalConfirmation(approver.phone, request.requestId, 'rejected', request.requestingOfficer);
        res.json({
            success: true,
            message: 'Request rejected successfully',
            data: request,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reject request',
            error: error.message,
        });
    }
};
//# sourceMappingURL=approvalController.js.map