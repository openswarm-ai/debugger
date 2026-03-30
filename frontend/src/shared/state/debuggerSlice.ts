import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  PULL_STRUCTURE_URL,
  PUSH_STRUCTURE_URL,
  RESET_COLOR_URL,
  RESET_EMOJI_URL,
} from './API_ENDPOINTS';
import { TreeNodeData, DebuggerSettings, SaveStatus, ExpandedState } from '@/types';
import type { RootState } from './store';

const DEFAULT_SETTINGS: DebuggerSettings = {
  pullRetryCount: 3,
  pullRetryDelay: 2,
  autoSave: false,
  defaultExpanded: true,
};

const loadSettings = (): DebuggerSettings => {
  try {
    const saved = localStorage.getItem('debugger-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

function buildExpandedState(nodes: TreeNodeData[], parentId = ''): ExpandedState {
  const result: ExpandedState = {};
  if (!Array.isArray(nodes)) return result;
  nodes.forEach((node) => {
    const nodeId = parentId ? `${parentId}/${node.name}` : node.name;
    if (node.children && node.children.length > 0) {
      result[nodeId] = true;
      Object.assign(result, buildExpandedState(node.children, nodeId));
    }
  });
  return result;
}

function updateChildrenToggle(children: TreeNodeData[] | undefined, checked: boolean): TreeNodeData[] {
  if (!children) return [];
  return children.map((child) => ({
    ...child,
    is_toggled: checked,
    children: updateChildrenToggle(child.children, checked),
  }));
}

function lightenColor(color: string, amt = 50): string {
  if (!color || typeof color !== 'string' || !color.startsWith('#') || color.length !== 7) {
    return '#ffffff';
  }
  const colorInt = parseInt(color.slice(1), 16);
  const r = Math.min(255, (colorInt >> 16) + amt);
  const g = Math.min(255, ((colorInt >> 8) & 0x00ff) + amt);
  const b = Math.min(255, (colorInt & 0x0000ff) + amt);
  return `#${((r << 16) + (g << 8) + b).toString(16).padStart(6, '0')}`;
}

interface DebuggerState {
  projectStructure: TreeNodeData[] | null;
  expanded: ExpandedState;
  error: string | null;
  loading: boolean;
  dirty: boolean;
  saveStatus: SaveStatus;
  settings: DebuggerSettings;
  showSettings: boolean;
}

const initialState: DebuggerState = {
  projectStructure: null,
  expanded: {},
  error: null,
  loading: true,
  dirty: false,
  saveStatus: 'idle',
  settings: loadSettings(),
  showSettings: false,
};

export const pullWithRetry = createAsyncThunk(
  'debugger/pullWithRetry',
  async (_, { getState }) => {
    const { debugger: state } = getState() as RootState;
    const { pullRetryCount, pullRetryDelay } = state.settings;

    for (let attempt = 1; attempt <= pullRetryCount; attempt++) {
      try {
        const response = await fetch(PULL_STRUCTURE_URL);
        const data: TreeNodeData[] = await response.json();
        return data;
      } catch {
        if (attempt < pullRetryCount) {
          await new Promise((resolve) => setTimeout(resolve, pullRetryDelay * 1000));
        }
      }
    }

    throw new Error(
      `Failed to connect to the backend after ${pullRetryCount} attempt${pullRetryCount !== 1 ? 's' : ''}. Make sure the server is running.`,
    );
  },
);

export const pushStructure = createAsyncThunk(
  'debugger/pushStructure',
  async (_, { getState }) => {
    const { debugger: state } = getState() as RootState;
    if (!state.projectStructure) throw new Error('No data to save');

    await fetch(PUSH_STRUCTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectStructure: state.projectStructure }),
    });

    const response = await fetch(PULL_STRUCTURE_URL);
    const data: TreeNodeData[] = await response.json();
    return data;
  },
);

export const resetColors = createAsyncThunk('debugger/resetColors', async () => {
  const resetResponse = await fetch(RESET_COLOR_URL, { method: 'POST' });
  const resetData: TreeNodeData[] = await resetResponse.json();

  await fetch(PUSH_STRUCTURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectStructure: resetData }),
  });

  const freshResponse = await fetch(PULL_STRUCTURE_URL);
  const fresh: TreeNodeData[] = await freshResponse.json();
  return fresh;
});

export const resetEmojis = createAsyncThunk('debugger/resetEmojis', async () => {
  const resetResponse = await fetch(RESET_EMOJI_URL, { method: 'POST' });
  const resetData: TreeNodeData[] = await resetResponse.json();

  await fetch(PUSH_STRUCTURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectStructure: resetData }),
  });

  const freshResponse = await fetch(PULL_STRUCTURE_URL);
  const fresh: TreeNodeData[] = await freshResponse.json();
  return fresh;
});

const debuggerSlice = createSlice({
  name: 'debugger',
  initialState,
  reducers: {
    toggleExpanded(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.expanded[id] = !state.expanded[id];
    },

    checkboxChange(state, action: PayloadAction<{ nodeId: string; checked: boolean }>) {
      const { nodeId, checked } = action.payload;
      if (!state.projectStructure) return;
      const pathParts = nodeId.split('/');

      const updateNode = (
        nodes: TreeNodeData[],
        parts: string[],
        check: boolean,
        forceCheck = false,
      ): TreeNodeData[] => {
        return nodes.map((node) => {
          if (node.name === parts[0]) {
            const shouldCheck = check || forceCheck;
            if (parts.length === 1) {
              return {
                ...node,
                is_toggled: shouldCheck,
                children: updateChildrenToggle(node.children, shouldCheck),
              };
            }
            if (node.children) {
              return {
                ...node,
                is_toggled: shouldCheck,
                children: updateNode(node.children, parts.slice(1), check, shouldCheck),
              };
            }
            return { ...node, is_toggled: shouldCheck };
          }
          return node;
        });
      };

      state.projectStructure = updateNode(state.projectStructure, pathParts, checked);
      state.dirty = true;
      state.saveStatus = 'idle';
    },

    colorChange(state, action: PayloadAction<{ nodeId: string; color: string }>) {
      const { nodeId, color } = action.payload;
      if (!state.projectStructure) return;
      const pathParts = nodeId.split('/');
      const amount = 50;

      const updateNode = (
        nodes: TreeNodeData[],
        parts: string[],
        col: string,
        isOriginalParent = false,
      ): TreeNodeData[] => {
        return nodes.map((node) => {
          if (node.name === parts[0]) {
            let newColor = node.color;
            let setManually = node.set_manually;

            if (parts.length === 1) {
              if (isOriginalParent) setManually = true;
              newColor = col;
            }

            if (node.children) {
              const updatedChildren = updateNode(node.children, parts.slice(1), col, isOriginalParent);
              const propagatedChildren = updatedChildren.map((child) => {
                if (!child.set_manually) {
                  const newPath = [...parts.slice(1), child.name];
                  return updateNode([child], newPath, lightenColor(col, amount), false)[0];
                }
                return child;
              });
              return {
                ...node,
                color: newColor,
                is_toggled: node.is_toggled,
                set_manually: setManually,
                children: propagatedChildren,
              };
            }
            return { ...node, color: newColor, is_toggled: node.is_toggled, set_manually: setManually };
          }
          return node;
        });
      };

      state.projectStructure = updateNode(state.projectStructure, pathParts, color, true);
      state.dirty = true;
      state.saveStatus = 'idle';
    },

    emojiChange(state, action: PayloadAction<{ nodeId: string; emoji: string }>) {
      const { nodeId, emoji } = action.payload;
      if (!state.projectStructure) return;
      const pathParts = nodeId.split('/');

      const propagateEmoji = (node: TreeNodeData, em: string): TreeNodeData => {
        if (!node.children) return node;
        const updatedChildren = node.children.map((child) => ({
          ...child,
          emoji: em,
          children: propagateEmoji(child, em).children,
        }));
        return { ...node, children: updatedChildren };
      };

      const updateNode = (nodes: TreeNodeData[], parts: string[], em: string): TreeNodeData[] => {
        return nodes.map((node) => {
          if (node.name === parts[0]) {
            let updatedNode = { ...node };
            if (parts.length === 1) {
              updatedNode.emoji = em;
            }
            if (node.children && parts.length > 1) {
              updatedNode = { ...updatedNode, children: updateNode(node.children, parts.slice(1), em) };
            }
            if (parts.length === 1 && node.children) {
              updatedNode.children = propagateEmoji(node, em).children;
            }
            return updatedNode;
          }
          return node;
        });
      };

      state.projectStructure = updateNode(state.projectStructure, pathParts, emoji);
      state.dirty = true;
      state.saveStatus = 'idle';
    },

    updateSettings(state, action: PayloadAction<Partial<DebuggerSettings>>) {
      state.settings = { ...state.settings, ...action.payload };
      localStorage.setItem('debugger-settings', JSON.stringify(state.settings));
    },

    markDirty(state) {
      state.dirty = true;
      state.saveStatus = 'idle';
    },

    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload;
    },

    setShowSettings(state, action: PayloadAction<boolean>) {
      state.showSettings = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(pullWithRetry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(pullWithRetry.fulfilled, (state, action) => {
        state.projectStructure = action.payload;
        state.loading = false;
        state.error = null;
        if (state.settings.defaultExpanded) {
          state.expanded = buildExpandedState(action.payload);
        } else {
          state.expanded = {};
        }
      })
      .addCase(pullWithRetry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown error';
      })

      .addCase(pushStructure.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(pushStructure.fulfilled, (state, action) => {
        state.projectStructure = action.payload;
        state.dirty = false;
        state.saveStatus = 'saved';
      })
      .addCase(pushStructure.rejected, (state) => {
        state.saveStatus = 'idle';
      })

      .addCase(resetColors.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(resetColors.fulfilled, (state, action) => {
        state.projectStructure = action.payload;
        state.dirty = false;
        state.saveStatus = 'saved';
      })
      .addCase(resetColors.rejected, (state) => {
        state.saveStatus = 'idle';
      })

      .addCase(resetEmojis.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(resetEmojis.fulfilled, (state, action) => {
        state.projectStructure = action.payload;
        state.dirty = false;
        state.saveStatus = 'saved';
      })
      .addCase(resetEmojis.rejected, (state) => {
        state.saveStatus = 'idle';
      });
  },
});

export const {
  toggleExpanded,
  checkboxChange,
  colorChange,
  emojiChange,
  updateSettings,
  markDirty,
  setSaveStatus,
  setShowSettings,
} = debuggerSlice.actions;

export default debuggerSlice.reducer;
