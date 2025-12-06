import { Workflow } from '@your-org/shared/types';
import { ExecutorService } from '@your-org/backend/services/executor';
import { WorkflowsController } from '@your-org/backend/controllers/workflows';

export class NodeSDK {
    private executorService: ExecutorService;
    private workflowsController: WorkflowsController;

    constructor() {
        this.executorService = new ExecutorService();
        this.workflowsController = new WorkflowsController();
    }

    public executeWorkflow(workflow: Workflow) {
        return this.executorService.execute(workflow);
    }

    public createWorkflow(data: any) {
        return this.workflowsController.create(data);
    }

    public updateWorkflow(id: string, data: any) {
        return this.workflowsController.update(id, data);
    }

    public deleteWorkflow(id: string) {
        return this.workflowsController.delete(id);
    }
}