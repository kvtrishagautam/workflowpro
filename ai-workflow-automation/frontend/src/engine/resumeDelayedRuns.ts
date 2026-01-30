import { getRuns, updateRun } from '../store/runStore';
import { executeNode } from './executeNode';
import { Workflow } from '../types';
import { WorkflowRun } from '../types/run';

export function resumeDelayedRuns(workflow: Workflow) {
    const runs = getRuns();

    runs
        .filter(
            (run) =>
                run.status === 'waiting' &&
                run.waitingUntil &&
                run.waitingUntil > Date.now()
        )
        .forEach((run) => {
            const remaining = (run.waitingUntil || Date.now()) - Date.now();

            console.log(
                `[RESUME] Found delayed run ${run.id}, resuming in ${(remaining / 1000).toFixed(1)}s`
            );

            setTimeout(() => {
                console.log(`[RESUME] Resuming run ${run.id} after delay`);
                run.status = 'running';
                run.waitingUntil = undefined;
                updateRun(run);

                const nodeMap = new Map(
                    workflow.nodes.map((n) => [n.id, n])
                );

                const lastLog = run.logs[run.logs.length - 1];
                if (!lastLog) {
                    console.warn(
                        `[WARN] No logs found for run ${run.id}`
                    );
                    return;
                }

                const node = nodeMap.get(lastLog.nodeId);
                if (node) {
                    const data = lastLog.output || lastLog.input;
                    executeNode(node, data, workflow, nodeMap, run).catch(
                        (err) => {
                            console.error(
                                `[ERROR] Failed to resume run ${run.id}:`,
                                err
                            );
                            run.status = 'failed';
                            run.finishedAt = Date.now();
                            updateRun(run);
                        }
                    );
                } else {
                    console.warn(
                        `[WARN] Node ${lastLog.nodeId} not found for run ${run.id}`
                    );
                }
            }, remaining);
        });
}
