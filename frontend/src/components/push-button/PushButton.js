import React from 'react';
import axios from 'axios';

const PushButton = ({ projectStructure, setProjectStructure }) => {
    const pushStructure = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:6969/push_structure', {
                projectStructure
            });
            setProjectStructure(response.data);
        } catch (error) {
            console.error('Error pushing project structure:', error);
        }
    };

    return (
        <button className="toolbar-btn" onClick={pushStructure} title="Push config to backend">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
        </button>
    );
};

export default PushButton;
