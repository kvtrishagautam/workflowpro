import React, { useState, useEffect } from 'react';
import { getRuns, clearRuns } from '../store/runStore';
import { WorkflowRun } from '../types/run';
import './RunHistory.css';

const RunHistory: React.FC = () => {
    const [runs, setRuns] = useState<WorkflowRun[]>([]);
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

    useEffect(() => {
        // Initial load
        setRuns(getRuns());

        // Poll for updates every 500ms
        const interval = setInterval(() => {
            setRuns(getRuns());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const handleClearRuns = () => {
        if (window.confirm('Clear all workflow runs?')) {
            clearRuns();
            setRuns([]);
            setExpandedRunId(null);
        }
    };

    const toggleExpand = (runId: string) => {
        setExpandedRunId(expandedRunId === runId ? null : runId);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return '✅';
            case 'failed':
                return '❌';
            case 'running':
                return '▶️';
            case 'waiting':
                return '⏸️';
            default:
                return '•';
        }
    };

    return (
        <div className="run-history">
            <div className="run-history-header">
                <h3>Workflow Runs</h3>
                <button
                    className="clear-button"
                    onClick={handleClearRuns}
                    disabled={runs.length === 0}
                    title="Clear all runs"
                >
                    🗑️
                </button>
            </div>

            {runs.length === 0 ? (
                <div className="empty-runs">
                    <p>No workflow runs yet</p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                        Click "Run" to execute your workflow
                    </p>
                </div>
            ) : (
                <div className="runs-list">
                    {runs.map((run) => (
                        <div key={run.id} className="run-card">
                            <div
                                className="run-card-header"
                                onClick={() => toggleExpand(run.id)}
                            >
                                <span className="status-icon">
                                    {getStatusIcon(run.status)}
                                </span>
                                <span className="status-text">
                                    {run.status}
                                </span>
                                <span className="run-time">
                                    {new Date(run.startedAt).toLocaleTimeString()}
                                </span>
                                <span className="run-logs-count">
                                    {run.logs.length} steps
                                </span>
                                <span className="expand-icon">
                                    {expandedRunId === run.id ? '▼' : '▶'}
                                </span>
                            </div>

                            {expandedRunId === run.id && (
                                <div className="run-card-details">
                                    <div className="run-info">
                                        <div className="info-row">
                                            <span>Started:</span>
                                            <span>
                                                {new Date(
                                                    run.startedAt
                                                ).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {run.finishedAt && (
                                            <div className="info-row">
                                                <span>Finished:</span>
                                                <span>
                                                    {new Date(
                                                        run.finishedAt
                                                    ).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        )}
                                        {run.status === 'waiting' && run.waitingUntil && (
                                            <div className="info-row">
                                                <span>Resuming at:</span>
                                                <span>
                                                    {new Date(
                                                        run.waitingUntil
                                                    ).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        )}
                                        {run.finishedAt && (
                                            <div className="info-row">
                                                <span>Duration:</span>
                                                <span>
                                                    {(
                                                        (run.finishedAt -
                                                            run.startedAt) /
                                                        1000
                                                    ).toFixed(2)}
                                                    s
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="logs-section">
                                        <h4>Steps</h4>
                                        <div className="logs-list">
                                            {run.logs.map((log, idx) => (
                                                <div
                                                    key={idx}
                                                    className="log-entry"
                                                >
                                                    <div className="log-header">
                                                        <span
                                                            className={`log-status ${log.status}`}
                                                        >
                                                            {log.status ===
                                                                'success'
                                                                ? '✓'
                                                                : '✕'}
                                                        </span>
                                                        <span className="log-type">
                                                            {log.nodeType}
                                                        </span>
                                                        <span className="log-id">
                                                            {log.nodeId}
                                                        </span>
                                                        <span className="log-time">
                                                            {new Date(
                                                                log.timestamp
                                                            ).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    {log.error && (
                                                        <div className="log-error">
                                                            Error:{' '}
                                                            {log.error}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RunHistory;
