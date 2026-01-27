import { Approver } from '../models/Approver.js';
export const getAllApprovers = async (req, res) => {
    try {
        const approvers = await Approver.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: approvers,
            count: approvers.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch approvers',
            error: error.message,
        });
    }
};
export const createApprover = async (req, res) => {
    try {
        const { name, phone, position } = req.body;
        // Check if approver with this phone already exists
        const existing = await Approver.findOne({ phone });
        if (existing) {
            res.status(400).json({
                success: false,
                message: 'Approver with this phone number already exists',
            });
            return;
        }
        // Check active approvers count
        const activeCount = await Approver.countDocuments({ isActive: true });
        if (activeCount >= 3) {
            res.status(400).json({
                success: false,
                message: 'Maximum 3 active approvers allowed. Please deactivate one first.',
            });
            return;
        }
        const approver = new Approver({
            name,
            phone,
            position,
            isActive: true,
        });
        await approver.save();
        res.status(201).json({
            success: true,
            message: 'Approver created successfully',
            data: approver,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create approver',
            error: error.message,
        });
    }
};
export const updateApprover = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, position, isActive } = req.body;
        const approver = await Approver.findById(id);
        if (!approver) {
            res.status(404).json({
                success: false,
                message: 'Approver not found',
            });
            return;
        }
        // If activating, check active count
        if (isActive && !approver.isActive) {
            const activeCount = await Approver.countDocuments({ isActive: true });
            if (activeCount >= 3) {
                res.status(400).json({
                    success: false,
                    message: 'Maximum 3 active approvers allowed',
                });
                return;
            }
        }
        if (name)
            approver.name = name;
        if (phone)
            approver.phone = phone;
        if (position)
            approver.position = position;
        if (isActive !== undefined)
            approver.isActive = isActive;
        await approver.save();
        res.json({
            success: true,
            message: 'Approver updated successfully',
            data: approver,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update approver',
            error: error.message,
        });
    }
};
export const deleteApprover = async (req, res) => {
    try {
        const { id } = req.params;
        const approver = await Approver.findByIdAndDelete(id);
        if (!approver) {
            res.status(404).json({
                success: false,
                message: 'Approver not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Approver deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete approver',
            error: error.message,
        });
    }
};
//# sourceMappingURL=approverController.js.map