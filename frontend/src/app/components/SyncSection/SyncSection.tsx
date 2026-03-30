import React from 'react';
import PushButton from '@/app/components/SyncSection/PushButton';
import ColorReset from '@/app/components/SyncSection/ColorReset';
import { SaveStatus } from '@/types';
import './SyncSection.css';

interface SyncSectionProps {
  onSave: () => void;
  onRefresh: () => void;
  dirty: boolean;
  saveStatus: SaveStatus;
}

const SyncSection: React.FC<SyncSectionProps> = ({ onSave, onRefresh, dirty, saveStatus }) => {
  return (
    <div className="sync-toolbar">
      <ColorReset onRefresh={onRefresh} disabled={!dirty} />
      <PushButton onSave={onSave} disabled={!dirty && saveStatus === 'idle'} saveStatus={saveStatus} />
    </div>
  );
};

export default SyncSection;
