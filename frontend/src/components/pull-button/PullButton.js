import React from 'react';
import axios from 'axios';

const PullButton = ({ setProjectStructure }) => {
    const pullStructure = async () => {
        try {
            const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '8324';
            const response = await axios.get(`http://127.0.0.1:${BACKEND_PORT}/api/debugger/pull_structure`);
            setProjectStructure(response.data);
        } catch (error) {
            console.error('Error fetching project structure:', error);
        }
    };

    return (
        <button className="toolbar-btn" onClick={pullStructure}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Pull
        </button>
    );
};

export default PullButton;
