import express from 'express';
import bodyParser from 'body-parser';
import { WorkflowsController } from './controllers/workflows';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const workflowsController = new WorkflowsController();

app.post('/api/workflows', workflowsController.createWorkflow.bind(workflowsController));
app.put('/api/workflows/:id', workflowsController.updateWorkflow.bind(workflowsController));
app.delete('/api/workflows/:id', workflowsController.deleteWorkflow.bind(workflowsController));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});