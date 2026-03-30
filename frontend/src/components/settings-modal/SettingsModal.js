import React, { useState } from 'react';
import './SettingsModal.css';

const NumberStepper = ({ value, min, max, onChange }) => {
    const increment = () => onChange(Math.min(max, value + 1));
    const decrement = () => onChange(Math.max(min, value - 1));

    return (
        <div className="number-stepper">
            <input
                type="number"
                className="number-stepper-input"
                value={value}
                min={min}
                max={max}
                onChange={e => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
            />
            <div className="number-stepper-controls">
                <button
                    className="number-stepper-btn"
                    onClick={increment}
                    disabled={value >= max}
                    aria-label="Increment"
                    tabIndex={-1}
                >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 7.5 6 4.5 9 7.5" />
                    </svg>
                </button>
                <button
                    className="number-stepper-btn"
                    onClick={decrement}
                    disabled={value <= min}
                    aria-label="Decrement"
                    tabIndex={-1}
                >
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 4.5 6 7.5 9 4.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const SettingsModal = ({ settings, setSettings, onResetColors, onResetEmojis, onClose }) => {
    const [confirmAction, setConfirmAction] = useState(null);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleConfirm = () => {
        if (confirmAction === 'colors') onResetColors();
        if (confirmAction === 'emojis') onResetEmojis();
        setConfirmAction(null);
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="settings-close" onClick={onClose} aria-label="Close settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="settings-body">
                    <div className="settings-group">
                        <label className="settings-label">
                            Pull Retry Count
                            <span className="settings-hint">Number of connection attempts on startup</span>
                        </label>
                        <NumberStepper
                            value={settings.pullRetryCount}
                            min={1}
                            max={20}
                            onChange={v => handleChange('pullRetryCount', v)}
                        />
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">
                            Pull Retry Delay (seconds)
                            <span className="settings-hint">Wait time between retry attempts</span>
                        </label>
                        <NumberStepper
                            value={settings.pullRetryDelay}
                            min={1}
                            max={30}
                            onChange={v => handleChange('pullRetryDelay', v)}
                        />
                    </div>

                    <div className="settings-group settings-toggle-group">
                        <label className="settings-label">
                            Auto Save
                            <span className="settings-hint">Automatically save changes after editing</span>
                        </label>
                        <button
                            className={`settings-toggle ${settings.autoSave ? 'active' : ''}`}
                            onClick={() => handleChange('autoSave', !settings.autoSave)}
                            aria-label="Toggle auto save"
                        >
                            <span className="settings-toggle-thumb" />
                        </button>
                    </div>

                    <div className="settings-group settings-toggle-group">
                        <label className="settings-label">
                            Expand All on Load
                            <span className="settings-hint">Start with all directories expanded when the tree loads</span>
                        </label>
                        <button
                            className={`settings-toggle ${settings.defaultExpanded ? 'active' : ''}`}
                            onClick={() => handleChange('defaultExpanded', !settings.defaultExpanded)}
                            aria-label="Toggle default expanded"
                        >
                            <span className="settings-toggle-thumb" />
                        </button>
                    </div>

                    <div className="settings-divider" />

                    <div className="settings-group">
                        <label className="settings-label">
                            Reset Defaults
                            <span className="settings-hint">Revert all nodes back to their default values and save</span>
                        </label>
                        {confirmAction ? (
                            <div className="settings-confirm">
                                <span className="settings-confirm-text">
                                    Reset all {confirmAction} to defaults?
                                </span>
                                <div className="settings-confirm-actions">
                                    <button
                                        className="settings-confirm-cancel"
                                        onClick={() => setConfirmAction(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="settings-confirm-btn"
                                        onClick={handleConfirm}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="settings-actions-row">
                                <button className="settings-action-btn" onClick={() => setConfirmAction('colors')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="13.5" cy="6.5" r="2.5" />
                                        <path d="M17.08 9.08a7 7 0 1 1-10.64.42" />
                                        <path d="M12 2v4" />
                                    </svg>
                                    Reset Colors
                                </button>
                                <button className="settings-action-btn" onClick={() => setConfirmAction('emojis')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                        <line x1="9" y1="9" x2="9.01" y2="9" />
                                        <line x1="15" y1="9" x2="15.01" y2="9" />
                                    </svg>
                                    Reset Emojis
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
