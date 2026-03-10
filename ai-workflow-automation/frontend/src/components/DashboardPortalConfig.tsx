import React from 'react';

interface ConfigProps {
    config: any;
    updateConfig: (key: string, value: any) => void;
}

export const DashboardPortalConfig: React.FC<ConfigProps> = ({ config, updateConfig }) => {

    const handleLaunchDashboard = () => {
        window.open('http://localhost:4000/standalone-dashboard.html', '_blank');
    };

    return (
        <div className="config-section">
            <h4>Dashboard Link Configuration</h4>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Analytics Portal</h5>
                <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '15px' }}>
                    This node links to the live analytics dashboard. It automatically shows the category that was just analyzed — no setup needed.
                </p>
                <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px' }}>
                    <b>Data Endpoint:</b> <code>http://localhost:4000/api/analysis/results/latest</code>
                </p>

                <button
                    onClick={handleLaunchDashboard}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    📊 Open Live Dashboard
                </button>
            </div>

            <div style={{ marginTop: '14px', padding: '12px 16px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '12px', color: '#2e7d32' }}>
                ✅ <strong>Auto-detect enabled:</strong> The dashboard automatically selects the most recently analyzed category. No configuration needed.
            </div>
        </div>
    );
};
