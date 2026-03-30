import React from 'react';

const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="save-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const PushButton = ({ onSave, disabled, saveStatus }) => {
    const isSaving = saveStatus === 'saving';
    const isSaved = saveStatus === 'saved';

    let icon, label, className = 'toolbar-btn';
    if (isSaving) {
        icon = <SpinnerIcon />;
        label = 'Saving';
        className += ' toolbar-btn-saving';
    } else if (isSaved) {
        icon = <CheckIcon />;
        label = 'Saved';
        className += ' toolbar-btn-saved';
    } else {
        icon = <SaveIcon />;
        label = 'Save';
    }

    return (
        <button
            className={className}
            onClick={onSave}
            disabled={disabled || isSaving}
        >
            {icon}
            {label}
        </button>
    );
};

export default PushButton;
