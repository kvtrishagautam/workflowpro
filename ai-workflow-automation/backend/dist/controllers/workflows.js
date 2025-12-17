"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsController = void 0;
class WorkflowsController {
    async createWorkflow(req, res) {
        const workflowData = req.body;
        const newWorkflow = new workflow_1.Workflow(workflowData);
        await newWorkflow.save();
        return res.status(201).json(newWorkflow);
    }
    async getWorkflows(req, res) {
        const workflows = await workflow_1.Workflow.find();
        return res.status(200).json(workflows);
    }
    async updateWorkflow(req, res) {
        const { id } = req.params;
        const workflowData = req.body;
        const updatedWorkflow = await workflow_1.Workflow.findByIdAndUpdate(id, workflowData, { new: true });
        if (!updatedWorkflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        return res.status(200).json(updatedWorkflow);
    }
    async deleteWorkflow(req, res) {
        const { id } = req.params;
        const deletedWorkflow = await workflow_1.Workflow.findByIdAndDelete(id);
        if (!deletedWorkflow) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        return res.status(204).send();
    }
}
exports.WorkflowsController = WorkflowsController;
