import React from 'react';
import SyncSection from '@/app/components/SyncSection/SyncSection';
import { SaveStatus } from '@/types';

interface DebuggerHeaderProps {
  onSave: () => void;
  onRefresh: () => void;
  dirty: boolean;
  saveStatus: SaveStatus;
  onOpenSettings: () => void;
}

const DebuggerHeader: React.FC<DebuggerHeaderProps> = ({
  onSave,
  onRefresh,
  dirty,
  saveStatus,
  onOpenSettings,
}) => {
  return (
    <header className="app-header">
      <div className="app-title">
        <img src="/logo.png" alt="Open Swarm" className="app-logo" />
        Debugger
      </div>
      <div className="app-actions">
        <SyncSection
          onSave={onSave}
          onRefresh={onRefresh}
          dirty={dirty}
          saveStatus={saveStatus}
        />
        <button className="toolbar-btn" onClick={onOpenSettings} aria-label="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Settings
        </button>
      </div>
    </header>
  );
};

export default DebuggerHeader;
