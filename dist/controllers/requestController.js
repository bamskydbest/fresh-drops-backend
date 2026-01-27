import { CashRequest } from '../models/CashRequest.js';
import { Approver } from '../models/Approver.js';
import { notifyRequester, sendApprovalRequest } from '../services/twilioService.js';
const generateRequestId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REQ-${year}${month}${day}-${random}`;
};
export const createRequest = async (req, res) => {
    try {
        const requestId = generateRequestId();
        const { body, files } = req;
        // 1️⃣ Map Multer files to public URLs
        const uploadedFiles = (files || []).map((file) => ({
            name: file.originalname,
            filename: file.filename,
            url: `${process.env.API_URL || 'http://localhost:3000'}/uploads/${file.filename}`,
        }));
        // 2️⃣ Handle "other" text field
        if (body.other) {
            uploadedFiles.push({ name: 'other', filename: '', url: body.other });
        }
        // 3️⃣ Save request in MongoDB
        const cashRequest = new CashRequest({
            requestingOfficer: body.requestingOfficer,
            requesterPhone: body.requesterPhone,
            position: body.position,
            department: body.department,
            purposeOfExpense: body.purposeOfExpense,
            amountRequested: body.amountRequested,
            paymentDay: body.paymentDay,
            operationalJustification: body.operationalJustification,
            impactIfNotApproved: body.impactIfNotApproved,
            supportingDocuments: uploadedFiles,
            requestId,
            dateOfRequest: new Date(),
            status: 'pending',
        });
        await cashRequest.save();
        // 4️⃣ Notify approvers
        const approvers = await Approver.find({ isActive: true }).limit(3);
        if (!approvers.length) {
            res.status(400).json({ success: false, message: 'No active approvers configured' });
            return;
        }
        const notificationPromises = approvers.map(approver => sendApprovalRequest({
            requestId: cashRequest.requestId,
            requestingOfficer: cashRequest.requestingOfficer,
            purpose: cashRequest.purposeOfExpense,
            amount: cashRequest.amountRequested,
            paymentDay: cashRequest.paymentDay,
            department: cashRequest.department,
            approverPhone: approver.phone,
            supportingDocuments: uploadedFiles, // include file links
        }));
        if (cashRequest.requesterPhone) {
            await notifyRequester(cashRequest.requesterPhone, cashRequest.requestId, 'submitted');
        }
        try {
            await Promise.all(notificationPromises);
            console.log('✅ WhatsApp notifications sent successfully');
        }
        catch (err) {
            console.error('❌ WhatsApp failed:', err);
        }
        res.status(201).json({
            success: true,
            message: 'Cash request submitted successfully',
            data: cashRequest,
        });
    }
    catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create request',
            error: error.message,
        });
    }
};
export const getAllRequests = async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        const requests = await CashRequest.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        res.json({
            success: true,
            data: requests,
            count: requests.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: error.message,
        });
    }
};
export const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await CashRequest.findOne({ requestId: id });
        if (!request) {
            res.status(404).json({
                success: false,
                message: 'Request not found',
            });
            return;
        }
        res.json({
            success: true,
            data: request,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request',
            error: error.message,
        });
    }
};
export const getRequestStats = async (req, res) => {
    try {
        const [total, pending, approved, rejected] = await Promise.all([
            CashRequest.countDocuments(),
            CashRequest.countDocuments({ status: 'pending' }),
            CashRequest.countDocuments({ status: 'approved' }),
            CashRequest.countDocuments({ status: 'rejected' }),
        ]);
        const totalAmount = await CashRequest.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amountRequested' } } },
        ]);
        res.json({
            success: true,
            data: {
                total,
                pending,
                approved,
                rejected,
                totalApprovedAmount: totalAmount[0]?.total || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message,
        });
    }
};
//# sourceMappingURL=requestController.js.map