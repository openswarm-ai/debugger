import React from 'react';
import axios from 'axios';

const ColorReset = ({ setProjectStructure }) => {
    const resetColors = async () => {
        try {
            const response = await axios.post('http://127.0.0.1:6969/reset_color');
            setProjectStructure(response.data);
        } catch (error) {
            console.error('Error resetting colors:', error);
        }
    };

    return (
        <button className="toolbar-btn" onClick={resetColors}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <path d="M17.08 9.08a7 7 0 1 1-10.64.42" />
                <path d="M12 2v4" />
            </svg>
            Reset
        </button>
    );
};

export default ColorReset;
