import React, { useState, useEffect } from 'react';
import { Workflow } from '../types';
import Canvas from '../components/Canvas';

const Editor: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);

    useEffect(() => {
        // Fetch the workflow data from the backend or initialize a new one
        const fetchWorkflow = async () => {
            // Replace with actual API call
            const response = await fetch('/api/workflows/1'); // Example endpoint
            const data = await response.json();
            setWorkflow(data);
        };

        fetchWorkflow();
    }, []);

    const handleSave = async () => {
        if (workflow) {
            // Save the workflow to the backend
            await fetch('/api/workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(workflow),
            });
        }
    };

    return (
        <div>
            <h1>Workflow Editor</h1>
            <Canvas workflow={workflow} />
            <button onClick={handleSave}>Save Workflow</button>
        </div>
    );
};

export default Editor;