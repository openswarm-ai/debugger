# Agent 3 — Redux Toolkit, Styling Migration, Framer Motion

**Phases covered:** 6 (Redux) + 7 (CSS → MUI `sx` + tokens) + 8 (Framer Motion)

**Prerequisite:** Agent 2 must be complete. The frontend should be running on Webpack 5 with TypeScript, all components in PascalCase folders under `src/app/`, `@/` path alias working, `API_ENDPOINTS.ts` in place.

**Prompt to give this agent:**
> Read `REFACTOR_PLAN/AGENT_3_REDUX_AND_STYLING.md` and execute every step. This adds Redux Toolkit for state management, rewrites all components from CSS/raw HTML to MUI `sx` prop with design tokens, and adds Framer Motion animations. Also read the template's `frontend/DESIGN.md` from https://github.com/openswarm-ai/webapp-template for the full design system specification — every styling rule in that document must be followed.

---

## Context

After Agent 2, the frontend has TypeScript components in the correct directory structure, but:
- All state lives in `Debugger.tsx` as local `useState`/`useRef` with prop drilling
- All styling is via `.css` files with CSS custom properties
- All UI uses raw HTML elements (`div`, `button`, `span`, etc.)
- No design token system, no dark/light mode toggle
- No Framer Motion animations

The template repo is at https://github.com/openswarm-ai/webapp-template — fetch these files:
- `frontend/DESIGN.md` — **READ THIS FULLY, it is the styling bible**
- `frontend/src/shared/styles/ThemeContext.tsx`
- `frontend/src/shared/state/store.ts`
- `frontend/src/shared/state/tempStateSlice.ts`
- `frontend/src/shared/hooks.ts`
- `frontend/src/app/pages/Health/Health.tsx` — reference for component patterns

---

## Phase 6: Redux Toolkit

### Step 1: Create `frontend/src/shared/state/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import debuggerReducer from './debuggerSlice';

export const store = configureStore({
  reducer: {
    debugger: debuggerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Step 2: Create `frontend/src/shared/hooks.ts`

Replace the stub with real typed hooks:

```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './state/store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

### Step 3: Create `frontend/src/shared/state/debuggerSlice.ts`

This is the core migration — all state from `Debugger.tsx` moves into a Redux slice.

**State shape:**
```typescript
interface DebuggerState {
  projectStructure: TreeNodeData[] | null;
  expanded: ExpandedState;
  error: string | null;
  loading: boolean;
  dirty: boolean;
  saveStatus: SaveStatus;
  settings: DebuggerSettings;
}
```

Import `TreeNodeData`, `ExpandedState`, `SaveStatus`, `DebuggerSettings` from `@/types`.

**Initial state:**
```typescript
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

const initialState: DebuggerState = {
  projectStructure: null,
  expanded: {},
  error: null,
  loading: true,
  dirty: false,
  saveStatus: 'idle',
  settings: loadSettings(),
};
```

**Async thunks** (use `createAsyncThunk`):
- `pullStructure` — fetches `PULL_STRUCTURE_URL`, returns the data
- `pullWithRetry` — loops with retry logic from current `App.js`
- `pushStructure` — POSTs to `PUSH_STRUCTURE_URL`, then pulls fresh
- `resetColors` — POSTs to `RESET_COLOR_URL`, saves, pulls fresh
- `resetEmojis` — POSTs to `RESET_EMOJI_URL`, saves, pulls fresh

**Reducers:**
- `toggleExpanded(nodeId)` — toggles expand state
- `checkboxChange({ nodeId, checked })` — propagates toggle down tree
- `colorChange({ nodeId, color })` — propagates color to children (with lighten logic)
- `emojiChange({ nodeId, emoji })` — propagates emoji to children
- `updateSettings(settings)` — updates settings and persists to localStorage
- `markDirty()` — sets dirty = true, saveStatus = 'idle'
- `setSaveStatus(status)` — for auto-save UI feedback

Move the `buildExpandedState`, `updateNode`, `updateChildren`, `lightenColor`, and `propagateEmojiToChildren` helper functions from `Debugger.tsx` into this slice file (or as standalone utilities).

### Step 4: Wire Redux into `Main.tsx`

Update `frontend/src/app/Main.tsx`:

```tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/shared/state/store';
import ClaudeThemeProvider from '@/shared/styles/ThemeContext';
import Debugger from '@/app/pages/Debugger/Debugger';

const Main: React.FC = () => {
  return (
    <Provider store={store}>
      <ClaudeThemeProvider>
        <Debugger />
      </ClaudeThemeProvider>
    </Provider>
  );
};

export default Main;
```

### Step 5: Rewrite `Debugger.tsx` to use Redux

Replace all `useState`/`useRef`/`useCallback` state management with:
- `useAppSelector` to read state
- `useAppDispatch` to dispatch actions and thunks
- Remove all prop drilling — child components read from the store directly

The component should shrink dramatically (from ~400 lines to ~80).

### Step 6: Update all child components to use Redux

Each component that currently receives handler props should instead:
- Import `useAppDispatch` and `useAppSelector` from `@/shared/hooks`
- Read its needed state via `useAppSelector`
- Dispatch actions directly via `useAppDispatch`

---

## Phase 7: Styling Migration — CSS → MUI `sx` + Design Tokens

### Step 7: Add `frontend/src/shared/styles/ThemeContext.tsx`

Fetch and copy the template's `ThemeContext.tsx` verbatim from the webapp-template repo. This provides:
- `useClaudeTokens()` hook — returns the full token object
- `useThemeMode()` hook — returns `{ mode, toggleMode }`
- `ClaudeThemeProvider` component — wraps the app with MUI theme + token contexts
- Light and dark token sets
- Shared tokens (radius, font, transition)

### Step 8: Add `frontend/DESIGN.md`

Fetch and copy the template's `frontend/DESIGN.md` verbatim from the webapp-template repo. This is the styling specification that all components must follow.

### Step 9: Delete ALL CSS files

Remove every `.css` file in the frontend:
- `src/index.css`
- `src/app/pages/Debugger/Debugger.css`
- `src/app/components/Tree/Tree.css`
- `src/app/components/Tree/TreeNode.css`
- `src/app/components/SyncSection/SyncSection.css`
- `src/app/components/EmojiPicker/EmojiPicker.css`
- `src/app/components/SettingsModal/SettingsModal.css`

Also remove all `import './Something.css'` lines from every component.

### Step 10: Rewrite every component with MUI `sx` + tokens

**Rules that apply to EVERY component** (from `DESIGN.md`):

1. `const c = useClaudeTokens()` as the first hook call
2. Zero hardcoded colors — every color references a token (`c.bg.page`, `c.text.primary`, etc.)
3. All styling via `sx={{}}` — never `style={{}}`, never CSS
4. Replace raw HTML with MUI equivalents:
   - `div` → `Box`
   - `button` → `Button` or `IconButton`
   - `span`, `p`, `h1`-`h6` → `Typography`
   - `input` → `TextField`
   - Inline `<svg>` icons → `@mui/icons-material` imports
5. Every `IconButton` wrapped in `Tooltip`
6. `textTransform: 'none'` on all buttons
7. Borders use `c.border.*` tokens (opacity-based, not solid)
8. Interactive elements have `transition: c.transition`
9. Import MUI components from individual paths: `import Box from '@mui/material/Box'`
10. `export default` at the bottom

**Component-by-component rewrite guide:**

#### `Debugger.tsx` (main page)
- Replace `<div className="app">` → `<Box sx={{ minHeight: '100vh', bgcolor: c.bg.page, color: c.text.primary }}>`
- Replace `<main className="app-main">` → `<Box component="main" sx={{ ... }}>`
- Loading state: Use MUI `CircularProgress` instead of custom SVG spinner
- Error state: Use `Typography` for text, `Button` for retry
- Empty state: Use `Typography`
- The tree card: `<Box sx={{ bgcolor: c.bg.surface, border: \`1px solid ${c.border.subtle}\`, borderRadius: c.radius.xl, ... }}>`

#### `DebuggerHeader.tsx`
- Replace `<header>` → `<Box component="header" sx={{ bgcolor: c.bg.surface, borderBottom: \`1px solid ${c.border.subtle}\`, ... }}>`
- Logo + title → `Typography` with `c.font.serif`
- Settings button → `<Tooltip title="Settings"><IconButton sx={{ color: c.text.tertiary, '&:hover': { color: c.accent.primary } }}><SettingsIcon /></IconButton></Tooltip>`
- Add a dark/light mode toggle button matching the template's Health.tsx pattern:
  ```tsx
  import LightModeIcon from '@mui/icons-material/LightMode';
  import DarkModeIcon from '@mui/icons-material/DarkMode';
  const { mode, toggleMode } = useThemeMode();
  ```

#### `Tree.tsx`
- Replace `<div className="tree-container">` → `<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>`

#### `TreeNode.tsx`
This is the most complex rewrite:
- Row container: `<Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderRadius: c.radius.sm, '&:hover': { bgcolor: c.bg.elevated }, transition: c.transition }}>`
- Expand chevron: Use `@mui/icons-material/ChevronRight` or `ExpandMore`, wrap in `<Tooltip><IconButton size="small">`
- Toggle switch: Use MUI `Switch` component with custom `sx` to match the accent color:
  ```tsx
  import Switch from '@mui/material/Switch';
  <Switch
    checked={node.is_toggled}
    onChange={(e) => dispatch(checkboxChange({ nodeId, checked: e.target.checked }))}
    size="small"
    sx={{
      '& .MuiSwitch-switchBase.Mui-checked': { color: c.accent.primary },
      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: c.accent.primary },
    }}
  />
  ```
- Node name: `<Typography sx={{ fontSize: '0.875rem', color: node.color, fontFamily: c.font.mono, opacity: node.is_toggled ? 1 : 0.4 }}>`
- Color dot: Replace the `<input type="color">` with a small circular `IconButton` that opens a color picker. Use `<Tooltip title="Change color">` wrapper.
- Toggled-off dimming: Apply `opacity: 0.4` via `sx` when `!node.is_toggled`
- Children container: `<Box sx={{ pl: 3 }}>`

#### `EmojiPicker.tsx`
- Replace the custom popup with MUI `Popover`:
  ```tsx
  import Popover from '@mui/material/Popover';
  ```
- Grid of emojis: Use `Box` with `sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5 }}`
- Each emoji button: `<IconButton size="small" sx={{ fontSize: '1.2rem' }} onClick={...}>`
- Category tabs: Use MUI `Tabs` + `Tab` or simple `Box` with `Button` group
- Pagination: Use `<IconButton>` with `ChevronLeft`/`ChevronRight` icons

#### `SyncSection.tsx`
- Replace `<div className="sync-toolbar">` → `<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>`

#### `PushButton.tsx`
- Replace `<button>` → `<Button>` from MUI
- Replace spinner SVG → `CircularProgress size={16}`
- Use `c.accent.primary` for the button color:
  ```tsx
  <Button
    onClick={handleSave}
    disabled={disabled}
    sx={{
      bgcolor: c.accent.primary,
      color: '#fff',
      textTransform: 'none',
      '&:hover': { bgcolor: c.accent.hover },
      '&:disabled': { opacity: 0.5 },
      transition: c.transition,
    }}
  >
  ```

#### `ColorReset.tsx`
- Replace `<button>` → `<Button>` with a refresh icon from `@mui/icons-material/Refresh`

#### `SettingsModal.tsx`
- Replace custom modal with MUI `Dialog`:
  ```tsx
  import Dialog from '@mui/material/Dialog';
  import DialogTitle from '@mui/material/DialogTitle';
  import DialogContent from '@mui/material/DialogContent';
  ```
- Use `PaperProps` for styling:
  ```tsx
  PaperProps={{
    sx: {
      borderRadius: 4,
      bgcolor: c.bg.surface,
      border: `1px solid ${c.border.subtle}`,
      boxShadow: c.shadow.lg,
      maxWidth: 600,
      width: '100%',
    },
  }}
  ```
- Backdrop blur: `slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}`
- Number steppers → `TextField` with `type="number"` and `InputProps`
- Toggle switches → MUI `Switch`
- Dividers → `<Box sx={{ height: '0.5px', bgcolor: c.border.medium, my: 2 }} />`
- Action buttons (Reset Colors, Reset Emojis) → MUI `Button` with destructive styling:
  ```tsx
  sx={{ color: c.status.error, '&:hover': { bgcolor: c.status.errorBg } }}
  ```
- Confirmation prompt → nested `Box` with `Button` pair

### Step 11: Remove `axios` dependency

After all components are rewritten to use Redux thunks (which use native `fetch`), `axios` is no longer needed. Remove it from `package.json` and run `npm install`.

### Step 12: Remove `emoji-mart` dependency

The custom `EmojiPicker` component uses a hand-built emoji grid from `emojis.ts`, not the `emoji-mart` library. Confirm `emoji-mart` is not imported anywhere, then remove it from `package.json`.

---

## Phase 8: Framer Motion

### Step 13: Add entrance animations to key components

**Tree nodes — staggered reveal on load:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, x: -8 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.2, delay: index * 0.02 }}
>
  {/* TreeNode content */}
</motion.div>
```

**Settings modal — entrance/exit:**
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence>
  {showSettings && (
    <Dialog open onClose={handleClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        {/* Dialog content */}
      </motion.div>
    </Dialog>
  )}
</AnimatePresence>
```

**Loading/error/empty states — fade in:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* State content */}
</motion.div>
```

**Save status indicator — fade transition:**
```tsx
<AnimatePresence mode="wait">
  <motion.span
    key={saveStatus}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
  </motion.span>
</AnimatePresence>
```

**Emoji picker popup — scale in:**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.9 }}
  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
>
```

---

## Step 14: Verify

1. `cd frontend && npm run dev` — builds without errors
2. Dark mode toggle works — UI switches between light and dark themes
3. All tree functionality works — expand/collapse, toggle, color picker, emoji picker
4. Save button shows saving/saved states with smooth transitions
5. Settings modal opens/closes with animation
6. Tree nodes animate in on load
7. No CSS files remain in the project (except potentially `index.css` if not cleaned up — delete it)
8. Every color in the UI comes from tokens (inspect with browser devtools)
9. No raw HTML elements — everything is MUI components
10. No `axios` or `emoji-mart` in `node_modules` after clean install

---

## Files Created

| File | Description |
|------|-------------|
| `frontend/src/shared/state/store.ts` | Redux store config |
| `frontend/src/shared/state/debuggerSlice.ts` | All debugger state, thunks, reducers |
| `frontend/src/shared/styles/ThemeContext.tsx` | Design token system (from template) |
| `frontend/DESIGN.md` | Design system specification (from template) |

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/shared/hooks.ts` | Stub → real typed Redux hooks |
| `frontend/src/app/Main.tsx` | Add `Provider` + `ClaudeThemeProvider` wrappers |
| `frontend/src/app/pages/Debugger/Debugger.tsx` | Full rewrite — Redux + MUI sx |
| `frontend/src/app/pages/Debugger/DebuggerHeader.tsx` | Full rewrite — MUI sx + dark mode toggle |
| `frontend/src/app/components/Tree/Tree.tsx` | MUI sx rewrite |
| `frontend/src/app/components/Tree/TreeNode.tsx` | MUI sx rewrite (biggest component) |
| `frontend/src/app/components/SyncSection/SyncSection.tsx` | MUI sx rewrite |
| `frontend/src/app/components/SyncSection/PushButton.tsx` | MUI sx rewrite |
| `frontend/src/app/components/SyncSection/ColorReset.tsx` | MUI sx rewrite |
| `frontend/src/app/components/EmojiPicker/EmojiPicker.tsx` | MUI sx + Popover rewrite |
| `frontend/src/app/components/SettingsModal/SettingsModal.tsx` | MUI Dialog rewrite |
| `frontend/package.json` | Remove `axios`, `emoji-mart` |

## Files Deleted

| File | Reason |
|------|--------|
| `frontend/src/index.css` | Replaced by ThemeContext tokens |
| `frontend/src/app/pages/Debugger/Debugger.css` | Replaced by MUI sx |
| `frontend/src/app/components/Tree/Tree.css` | Replaced by MUI sx |
| `frontend/src/app/components/Tree/TreeNode.css` | Replaced by MUI sx |
| `frontend/src/app/components/SyncSection/SyncSection.css` | Replaced by MUI sx |
| `frontend/src/app/components/EmojiPicker/EmojiPicker.css` | Replaced by MUI sx |
| `frontend/src/app/components/SettingsModal/SettingsModal.css` | Replaced by MUI sx |
