import { Request, Response } from 'express';
import { Workflow } from '../models/workflow';

export class WorkflowsController {
    public async createWorkflow(req: Request, res: Response): Promise<Response> {
        const workflowData = req.body;
        const newWorkflow = new Workflow(workflowData);
        await newWorkflow.save();
        return res.status(201).json(newWorkflow);
    }

    public async getWorkflows(req: Request, res: Response): Promise<Response> {
        const workflows = await Workflow.find();
        return res.status(200).json(workflows);
    }

    public async updateWorkflow(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const workflowData = req.body;
        const updatedWorkflow = await Workflow.findByIdAndUpdate(id, workflowData, { new: true });
        if (!updatedWorkflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        return res.status(200).json(updatedWorkflow);
    }

    public async deleteWorkflow(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const deletedWorkflow = await Workflow.findByIdAndDelete(id);
        if (!deletedWorkflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        return res.status(204).send();
    }
}