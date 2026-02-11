import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { WorkflowAPI } from '../services/workflowAPI';
import { Workflow } from '../types'; // Verify types
import './Profile.css'; // We will create this css next

const Profile: React.FC = () => {
    const history = useHistory();
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ workflowId: string; workflowName: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const data = await WorkflowAPI.getAllWorkflows();
            setWorkflows(data);
        } catch (err) {
            let message = 'Failed to fetch workflows';
            if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        history.push('/editor');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        history.push('/');
    };

    const handleDeleteClick = (e: React.MouseEvent, workflowId: string, workflowName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirm({ workflowId, workflowName });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;

        setIsDeleting(true);
        try {
            await WorkflowAPI.deleteWorkflow(deleteConfirm.workflowId);
            // Remove from local state
            setWorkflows(workflows.filter(wf => wf.id !== deleteConfirm.workflowId));
            setDeleteConfirm(null);
        } catch (err) {
            alert(`Failed to delete workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteConfirm(null);
    };

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="profile-brand">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">WorkflowPro</span>
                </div>
                <div className="profile-user">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>

            <main className="profile-content">
                <div className="content-header">
                    <h1>My Workflows</h1>
                    <button onClick={handleCreateNew} className="new-workflow-btn">
                        + New Workflow
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading your workflows...</div>
                ) : error ? (
                    <div className="error-message">Error: {error}</div>
                ) : workflows.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't created any workflows yet.</p>
                        <button onClick={handleCreateNew} className="new-workflow-btn-secondary">
                            Get Started
                        </button>
                    </div>
                ) : (
                    <div className="workflow-grid">
                        {workflows.map(wf => (
                            <div key={wf.id} className="workflow-card-wrapper">
                                <Link to={`/editor?id=${wf.id}`} className="workflow-card">
                                    <div className="card-top">
                                        <h3 className="wf-name">{wf.name}</h3>
                                        <span className={`status-badge ${wf.isActive ? 'active' : 'inactive'}`}>
                                            {wf.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="wf-desc">{wf.description || 'No description'}</p>
                                    <div className="card-meta">
                                        <span>{wf.nodes?.length || 0} Nodes</span>
                                        <span>Updated: {new Date(wf.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </Link>
                                <button
                                    className="delete-workflow-btn"
                                    onClick={(e) => handleDeleteClick(e, wf.id, wf.name)}
                                    title="Delete workflow"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="delete-dialog-overlay" onClick={handleCancelDelete}>
                    <div className="delete-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-dialog-header">
                            <h2>⚠️ Delete Workflow</h2>
                        </div>
                        <div className="delete-dialog-body">
                            <p>Are you sure you want to delete this workflow?</p>
                            <p className="workflow-name-highlight">"{deleteConfirm.workflowName}"</p>
                            <p className="warning-text">This action cannot be undone.</p>
                        </div>
                        <div className="delete-dialog-footer">
                            <button
                                className="cancel-btn"
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-delete-btn"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
