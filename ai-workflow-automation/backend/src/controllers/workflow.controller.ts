import { Response } from 'express';
import mongoose from 'mongoose';
import { Workflow } from '../models/Workflow';
import { AuthRequest } from '../middleware/auth.middleware';

export const createWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, nodes, edges } = req.body;
        const workflowId = req.body.id || `wf_${Date.now()}`;

        const workflow = new Workflow({
            id: workflowId,
            userId: req.user._id,
            name,
            description,
            nodes: nodes || [],
            edges: edges || [],
        });

        await workflow.save();

        const webhookNodes = (nodes || []).filter((n: any) => n.type === 'webhook');

        res.status(201).json({
            status: 'saved',
            workflowId: workflow.id,
            webhooks: webhookNodes.map((n: any) => {
                const config = n.data?.config || n.config || {};
                return {
                    method: config.httpMethod || config.method || 'POST',
                    path: `/webhook${config.path}`,
                    testPath: `/webhook/test${config.path}`,
                    authentication: config.authentication || 'none'
                };
            })
        });
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
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                { id: req.params.id }
            ].filter(q => q !== undefined),
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        res.json(workflow);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, nodes, edges, isActive } = req.body;

        const workflow = await Workflow.findOneAndUpdate(
            {
                $or: [
                    { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                    { id: req.params.id }
                ].filter(q => q !== undefined),
                userId: req.user._id
            },
            { name, description, nodes, edges, isActive },
            { new: true, runValidators: true }
        );

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        res.json(workflow);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOneAndDelete({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                { id: req.params.id }
            ].filter(q => q !== undefined),
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
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                { id: req.params.id }
            ].filter(q => q !== undefined),
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        workflow.isActive = !workflow.isActive;
        await workflow.save();

        res.json(workflow);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const executeWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const workflow = await Workflow.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                { id: req.params.id }
            ].filter(q => q !== undefined),
            userId: req.user._id,
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        // Execute the workflow using the unified execution service
        const { executeWorkflow } = await import('../services/executionService');

        // Execute the workflow
        const result = await executeWorkflow(
            workflow as any,
            req.body.triggerData || {}
        );

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

