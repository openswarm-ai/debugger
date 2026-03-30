import React from 'react';
import { SaveStatus } from '@/types';

const SaveIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const SpinnerIcon: React.FC = () => (
  <svg className="save-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

interface PushButtonProps {
  onSave: () => void;
  disabled: boolean;
  saveStatus: SaveStatus;
}

const PushButton: React.FC<PushButtonProps> = ({ onSave, disabled, saveStatus }) => {
  const isSaving = saveStatus === 'saving';
  const isSaved = saveStatus === 'saved';

  return (
    <button
      className={`toolbar-btn ${isSaving ? 'toolbar-btn-saving' : ''} ${isSaved ? 'toolbar-btn-saved' : ''}`}
      onClick={onSave}
      disabled={disabled || isSaving}
      aria-label="Save"
    >
      {isSaving ? <SpinnerIcon /> : isSaved ? <CheckIcon /> : <SaveIcon />}
      {isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}
    </button>
  );
};

export default PushButton;
