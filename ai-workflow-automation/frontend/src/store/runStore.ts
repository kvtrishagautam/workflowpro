import { WorkflowRun } from '../types/run';

let runs: WorkflowRun[] = [];

export function createRun(): WorkflowRun {
    const run: WorkflowRun = {
        id: crypto.randomUUID(),
        status: 'running',
        startedAt: Date.now(),
        logs: [],
    };

    runs.unshift(run); // newest first
    persist();
    return run;
}

export function updateRun(run: WorkflowRun) {
    runs = runs.map((r) => (r.id === run.id ? run : r));
    persist();
}

export function getRuns(): WorkflowRun[] {
    return runs;
}

export function clearRuns() {
    runs = [];
    persist();
}

function persist() {
    if (typeof window !== 'undefined') {
        localStorage.setItem('workflow_runs', JSON.stringify(runs));
    }
}

// Hydrate from localStorage on load
(function hydrate() {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('workflow_runs');
        if (saved) {
            try {
                runs = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to hydrate runs from localStorage:', e);
                runs = [];
            }
        }
    }
})();
