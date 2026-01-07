import { Response } from 'express';
import { Workflow } from '../models/Workflow';
import { AuthRequest } from '../middleware/auth.middleware';

export const createWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, nodes, edges } = req.body;

        const workflow = new Workflow({
            userId: req.user._id,
            name,
            description,
            nodes: nodes || [],
            edges: edges || [],
        });

        await workflow.save();

        res.status(201).json({ workflow });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getWorkflows = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const workflows = await Workflow.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Workflow.countDocuments({ userId: req.user._id });

        res.json({
            workflows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        res.json({ workflow });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, nodes, edges, isActive } = req.body;

        const workflow = await Workflow.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, description, nodes, edges, isActive },
            { new: true, runValidators: true }
        );

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        res.json({ workflow });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        res.json({ message: 'Workflow deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        workflow.isActive = !workflow.isActive;
        await workflow.save();

        res.json({ workflow });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const executeWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        // Import execution service
        const { workflowExecutionService } = await import('../services/workflowExecution.service');

        // Execute the workflow
        const result = await workflowExecutionService.executeWorkflow(
            workflow._id.toString(),
            workflow.nodes,
            workflow.edges,
            req.body.triggerData || {}
        );

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

