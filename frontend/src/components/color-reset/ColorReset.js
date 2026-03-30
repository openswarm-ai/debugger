import React from 'react';

const ColorReset = ({ onRefresh, disabled }) => {
    return (
        <button className="toolbar-btn" onClick={onRefresh} disabled={disabled}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
        </button>
    );
};

export default ColorReset;
