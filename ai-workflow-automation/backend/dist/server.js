"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const workflows_1 = require("./controllers/workflows");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(body_parser_1.default.json());
const workflowsController = new workflows_1.WorkflowsController();
app.post('/api/workflows', workflowsController.createWorkflow.bind(workflowsController));
app.put('/api/workflows/:id', workflowsController.updateWorkflow.bind(workflowsController));
app.delete('/api/workflows/:id', workflowsController.deleteWorkflow.bind(workflowsController));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
