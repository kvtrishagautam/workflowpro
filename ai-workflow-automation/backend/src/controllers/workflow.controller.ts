import { Response } from 'express';
import mongoose from 'mongoose';
import { Workflow } from '../models/Workflow';
import { AuthRequest } from '../middleware/auth.middleware';

export const createWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, description, nodes, edges } = req.body;
        const workflowId = req.body.id || `wf_${Date.now()}`;

        // Upsert: if a workflow with this id already exists for this user, update it
        // instead of creating a duplicate. This handles the case where the frontend
        // accidentally POSTs to create instead of PUT to update.
        const existing = await Workflow.findOne({ id: workflowId, userId: req.user._id });

        let workflow;
        if (existing) {
            // Update existing workflow (with markModified for Mixed-type config fields)
            if (name !== undefined) existing.set('name', name);
            if (description !== undefined) existing.set('description', description);
            if (nodes !== undefined) existing.set('nodes', nodes);
            if (edges !== undefined) existing.set('edges', edges);
            existing.markModified('nodes');
            existing.markModified('edges');
            await existing.save();
            workflow = existing;
        } else {
            // Create a brand-new workflow
            workflow = new Workflow({
                id: workflowId,
                userId: req.user._id,
                name,
                description,
                nodes: nodes || [],
                edges: edges || [],
            });
            await workflow.save();
        }

        const webhookNodes = (nodes || []).filter((n: any) => n.type === 'webhook');

        res.status(existing ? 200 : 201).json({
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

        // We cannot use findOneAndUpdate for Mixed-type fields (like node.data.config)
        // because Mongoose won't detect changes in nested Mixed objects unless we
        // explicitly call markModified(). So we fetch, mutate, markModified, then save.
        const workflow = await Workflow.findOne({
            $or: [
                { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : undefined },
                { id: req.params.id }
            ].filter(q => q !== undefined),
            userId: req.user._id
        });

        if (!workflow) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }

        if (name !== undefined) workflow.set('name', name);
        if (description !== undefined) workflow.set('description', description);
        if (nodes !== undefined) workflow.set('nodes', nodes);
        if (edges !== undefined) workflow.set('edges', edges);
        if (isActive !== undefined) workflow.set('isActive', isActive);

        // CRITICAL: tell Mongoose that Mixed-type embedded fields have changed
        workflow.markModified('nodes');
        workflow.markModified('edges');

        await workflow.save();

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

