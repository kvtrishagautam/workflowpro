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
                            <Link to={`/editor?id=${wf.id}`} key={wf.id} className="workflow-card">
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
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Profile;
