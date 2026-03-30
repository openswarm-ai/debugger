export interface TreeNodeData {
  name: string;
  color: string;
  is_toggled: boolean;
  set_manually: boolean;
  emoji: string;
  children?: TreeNodeData[];
}

export interface DebuggerSettings {
  pullRetryCount: number;
  pullRetryDelay: number;
  autoSave: boolean;
  defaultExpanded: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved';

export interface ExpandedState {
  [nodeId: string]: boolean;
}
