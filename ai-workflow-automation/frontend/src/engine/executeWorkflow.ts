import { Workflow } from '../types';
import { executeNode } from './executeNode';
import { createRun, updateRun } from '../store/runStore';

export async function executeWorkflow(
    workflow: Workflow,
    inputData: any
): Promise<void> {
    if (!workflow.nodes || workflow.nodes.length === 0) {
        throw new Error('Workflow has no nodes');
    }

    const run = createRun();

    // Find trigger node (webhook, schedule, or first node without incoming edges)
    const startNode = workflow.nodes.find((n) => n.type === 'webhook' || n.type === 'schedule')
                   || workflow.nodes.find((n) => {
                       // Find node with no incoming edges (true start node)
                       return !workflow.edges.some((e) => e.target === n.id);
                   });

    if (!startNode) {
        run.status = 'failed';
        run.finishedAt = Date.now();
        updateRun(run);
        throw new Error('No trigger node found. Add a webhook or schedule node to start the workflow.');
    }

    const nodeMap = new Map(
        workflow.nodes.map((n) => [n.id, n])
    );

    console.log(
        '%c[WORKFLOW START]',
        'color: green; font-weight: bold;',
        `Executing workflow with input:`,
        inputData
    );

    try {
        await executeNode(startNode, inputData, workflow, nodeMap, run);
        run.status = 'success';
        run.finishedAt = Date.now();
        updateRun(run);
        console.log(
            '%c[WORKFLOW COMPLETE]',
            'color: green; font-weight: bold;'
        );
    } catch (error) {
        run.status = 'failed';
        run.finishedAt = Date.now();
        updateRun(run);
        console.error(
            '%c[WORKFLOW ERROR]',
            'color: red; font-weight: bold;',
            error
        );
        throw error;
    }
}
