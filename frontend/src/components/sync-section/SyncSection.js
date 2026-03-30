import React from 'react';
import PushButton from '../push-button/PushButton';
import ColorReset from '../color-reset/ColorReset';
import './SyncSection.css';

const SyncSection = ({ onSave, onRefresh, dirty, saveStatus }) => {
    return (
        <div className="sync-toolbar">
            <ColorReset onRefresh={onRefresh} disabled={!dirty} />
            <PushButton onSave={onSave} disabled={!dirty && saveStatus === 'idle'} saveStatus={saveStatus} />
        </div>
    );
};

export default SyncSection;
