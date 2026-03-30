# Agent 2 — Frontend: CRA → Webpack 5, JS → TypeScript, Architecture Restructure

**Phases covered:** 3 (Build tooling) + 4 (TypeScript) + 5 (Architecture restructure)

**Prerequisite:** Agent 1 must be complete. The backend should be running on FastAPI at port 8324 with routes at `/api/debugger/*` and `/api/health/*`.

**Prompt to give this agent:**
> Read `REFACTOR_PLAN/AGENT_2_BUILD_AND_TYPESCRIPT.md` and execute every step. This replaces Create React App with Webpack 5, converts all JavaScript to TypeScript, and restructures the frontend directory layout.

---

## Context

The frontend currently uses Create React App (`react-scripts`), plain JavaScript, and a flat `src/components/` directory with kebab-case folders. The [webapp-template](https://github.com/openswarm-ai/webapp-template) uses Webpack 5 with Babel, TypeScript, PascalCase component folders, a `shared/` directory for hooks/state/styles, and `@/` path alias.

The template repo is at https://github.com/openswarm-ai/webapp-template — fetch the following files from it as reference:
- `frontend/package.json`
- `frontend/webpack.config.js`
- `frontend/tsconfig.json`
- `frontend/src/index.tsx`
- `frontend/src/app/Main.tsx`
- `frontend/src/shared/hooks.ts`
- `frontend/src/shared/state/store.ts`
- `frontend/src/shared/state/tempStateSlice.ts`
- `frontend/src/shared/state/API_ENDPOINTS.ts`
- `frontend/src/shared/styles/ThemeContext.tsx`

**After Agent 1, the backend API base is `http://localhost:8324/api/debugger`.**

---

## Phase 3: Build Tooling — CRA → Webpack 5

### Step 1: Rewrite `frontend/package.json`

Replace the full contents. Key changes:
- Remove `react-scripts`, `web-vitals`, `@testing-library/*`, `cross-env`
- Keep `axios` and `emoji-mart` for now (Agent 3 will remove them when rewriting components)
- Add `@reduxjs/toolkit`, `react-redux`, `framer-motion`, `react-router-dom` as dependencies
- Upgrade MUI from v5 to v7: `@mui/material: ^7.3.9`, `@mui/icons-material: ^7.3.9`
- Add all Webpack/Babel/TypeScript devDependencies
- Replace scripts with `dev`, `build`, `build:watch`, `clean`

```json
{
  "name": "debugger-gui",
  "version": "0.1.0",
  "private": true,
  "description": "Visual debug configuration tool",
  "scripts": {
    "dev": "webpack serve --mode=development --open",
    "build": "webpack --mode=production",
    "build:watch": "webpack --mode=development --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@mui/icons-material": "^7.3.9",
    "@mui/material": "^7.3.9",
    "@reduxjs/toolkit": "^2.8.2",
    "axios": "^1.7.2",
    "emoji-mart": "^5.6.0",
    "framer-motion": "^12.36.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.2.0",
    "react-router-dom": "^7.13.1"
  },
  "devDependencies": {
    "@babel/core": "^7.28.0",
    "@babel/preset-env": "^7.28.0",
    "@babel/preset-react": "^7.27.1",
    "@babel/preset-typescript": "^7.27.1",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/react-redux": "^7.1.34",
    "babel-loader": "^9.2.1",
    "css-loader": "^6.8.0",
    "css-modules-types-loader": "^0.6.10",
    "html-webpack-plugin": "^5.5.0",
    "sass": "^1.89.2",
    "sass-loader": "^16.0.5",
    "style-loader": "^3.3.0",
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "webpack-dev-server": "^4.15.0"
  },
  "babel": {
    "presets": [
      "@babel/preset-env",
      "@babel/preset-react",
      "@babel/preset-typescript"
    ]
  }
}
```

### Step 2: Add `frontend/webpack.config.js`

Fetch and copy the template's `frontend/webpack.config.js`. It should include:
- Entry: `./src/index.tsx`
- Babel loader for `.js`, `.jsx`, `.ts`, `.tsx`
- SCSS module support
- `@` alias → `src/`
- `HtmlWebpackPlugin` pointing to `./public/index.html`
- Dev server on port 3000 with hot reload and `historyApiFallback`

### Step 3: Add `frontend/tsconfig.json`

Fetch and copy the template's `frontend/tsconfig.json`. It should include:
- `strict: true`
- `@/*` path alias
- JSX preserve
- ES module interop

### Step 4: Update `frontend/run.sh`

Change the start command from `npm run start` to `npm run dev`.

### Step 5: Delete `node_modules` and reinstall

Run `rm -rf frontend/node_modules frontend/package-lock.json && cd frontend && npm install` to get a clean install with the new dependencies.

### Step 6: Verify the build

Run `cd frontend && npm run dev` — it should start Webpack dev server on port 3000. It will fail because the entry point is still `.js` — that's fine, we fix it in Phase 4.

---

## Phase 4: JavaScript → TypeScript

### Step 7: Create type definitions

Create `frontend/src/types/index.ts` with shared interfaces:

```typescript
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
```

### Step 8: Create new entry point `frontend/src/index.tsx`

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './app/Main';

const root = document.getElementById('root')!;
createRoot(root).render(<Main />);
```

Delete the old `frontend/src/index.js`.

### Step 9: Create `frontend/src/app/Main.tsx`

This is a thin wrapper — for now without Redux Provider (Agent 3 adds that):

```tsx
import React from 'react';
import Debugger from '@/app/pages/Debugger/Debugger';

const Main: React.FC = () => {
  return <Debugger />;
};

export default Main;
```

### Step 10: Create the shared infrastructure stubs

These will be fully wired by Agent 3, but create the files now so imports resolve:

**`frontend/src/shared/state/API_ENDPOINTS.ts`:**
```typescript
const API_URL = 'http://localhost:8324/api';

export const PULL_STRUCTURE_URL = API_URL + '/debugger/pull_structure';
export const PUSH_STRUCTURE_URL = API_URL + '/debugger/push_structure';
export const RESET_COLOR_URL = API_URL + '/debugger/reset_color';
export const RESET_EMOJI_URL = API_URL + '/debugger/reset_emoji';
```

**`frontend/src/shared/hooks.ts`** (stub — Agent 3 adds Redux hooks):
```typescript
export {};
```

**`frontend/src/shared/constants/emojis.ts`:**
Copy the contents of `frontend/src/assets/emojis.js`, rename to `.ts`, and add a type annotation to the export:

```typescript
export const emojiList: { category: string; emojis: string[] }[] = [
  // ... existing emoji data, copy verbatim from emojis.js
];
```

---

## Phase 5: Architecture Restructure

### Step 11: Create the new directory structure

```
frontend/src/
├── index.tsx                          # Already created in Step 8
├── types/
│   └── index.ts                       # Already created in Step 7
├── app/
│   ├── Main.tsx                       # Already created in Step 9
│   ├── pages/
│   │   └── Debugger/
│   │       ├── Debugger.tsx           # Main page (migrated from App.js)
│   │       └── DebuggerHeader.tsx     # Header bar extracted from App.js
│   └── components/
│       ├── Tree/
│       │   ├── Tree.tsx
│       │   └── TreeNode.tsx
│       ├── SyncSection/
│       │   ├── SyncSection.tsx
│       │   ├── PushButton.tsx
│       │   └── ColorReset.tsx
│       ├── EmojiPicker/
│       │   └── EmojiPicker.tsx
│       └── SettingsModal/
│           └── SettingsModal.tsx
├── shared/
│   ├── hooks.ts                       # Already created in Step 10
│   ├── state/
│   │   └── API_ENDPOINTS.ts          # Already created in Step 10
│   ├── styles/                        # Empty for now — Agent 3 adds ThemeContext
│   └── constants/
│       └── emojis.ts                  # Already created in Step 10
```

### Step 12: Migrate components to TypeScript with new locations

For each component, the process is:
1. Copy the `.js` file to the new location as `.tsx`
2. Add TypeScript interfaces for props
3. Update imports to use `@/` path alias
4. Update imports to use `API_ENDPOINTS.ts` constants for any API URLs
5. Replace `axios` calls with native `fetch`
6. Keep the existing CSS imports working temporarily (Agent 3 removes all CSS)

**Detailed migration for each component:**

#### `Tree.tsx` (from `components/tree/Tree.js`)
New location: `frontend/src/app/components/Tree/Tree.tsx`

- Add props interface using the types from `@/types`
- Import `TreeNode` from `@/app/components/Tree/TreeNode`
- Keep the CSS import pointing to the old location temporarily (it will be deleted by Agent 3): `import '../../../components/tree/Tree.css'` — or better, copy `Tree.css` alongside `Tree.tsx` for now

#### `TreeNode.tsx` (from `components/tree_node/TreeNode.js`)
New location: `frontend/src/app/components/Tree/TreeNode.tsx`

- Add props interface
- Import `EmojiPicker` from `@/app/components/EmojiPicker/EmojiPicker`
- Keep CSS import temporarily

#### `SyncSection.tsx` (from `components/sync-section/SyncSection.js`)
New location: `frontend/src/app/components/SyncSection/SyncSection.tsx`

- Add props interface
- Import child components from new locations

#### `PushButton.tsx` (from `components/push-button/PushButton.js`)
New location: `frontend/src/app/components/SyncSection/PushButton.tsx`

#### `ColorReset.tsx` (from `components/color-reset/ColorReset.js`)
New location: `frontend/src/app/components/SyncSection/ColorReset.tsx`

#### `EmojiPicker.tsx` (from `components/emoji-picker/EmojiPicker.js`)
New location: `frontend/src/app/components/EmojiPicker/EmojiPicker.tsx`

- Import emojis from `@/shared/constants/emojis`

#### `SettingsModal.tsx` (from `components/settings-modal/SettingsModal.js`)
New location: `frontend/src/app/components/SettingsModal/SettingsModal.tsx`

### Step 13: Migrate `App.js` → `Debugger.tsx` + `DebuggerHeader.tsx`

This is the biggest migration. Split `App.js` into:

**`frontend/src/app/pages/Debugger/Debugger.tsx`** — the main page component:
- Contains all state (`useState`, `useRef`, `useCallback`, `useEffect`)
- Contains all handler functions
- Renders the header, tree, loading/error/empty states, and settings modal
- Uses `@/` imports for all components
- Uses `API_ENDPOINTS` for URLs
- Replaces `axios` with native `fetch`:
  ```typescript
  // Before
  const response = await axios.get(`${API_BASE}/pull_structure`);
  return response.data;
  
  // After
  const response = await fetch(PULL_STRUCTURE_URL);
  return response.json();
  
  // Before
  await axios.post(`${API_BASE}/push_structure`, { projectStructure: current });
  
  // After
  await fetch(PUSH_STRUCTURE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectStructure: current }),
  });
  ```

**`frontend/src/app/pages/Debugger/DebuggerHeader.tsx`** — extracted header:
- Receives `onSave`, `onRefresh`, `dirty`, `saveStatus`, `onOpenSettings` as props
- Renders the logo, title, `SyncSection`, and Settings button

### Step 14: Copy CSS files temporarily

For each component that has a `.css` file, copy the CSS file alongside the new `.tsx` file. This keeps styling working until Agent 3 deletes all CSS and rewrites everything with MUI `sx`. The CSS files to copy:

| Source | Destination |
|--------|-------------|
| `src/App.css` | `src/app/pages/Debugger/Debugger.css` |
| `src/index.css` | Keep in place (loaded by `index.tsx`) |
| `src/components/tree/Tree.css` | `src/app/components/Tree/Tree.css` |
| `src/components/tree_node/TreeNode.css` | `src/app/components/Tree/TreeNode.css` |
| `src/components/sync-section/SyncSection.css` | `src/app/components/SyncSection/SyncSection.css` |
| `src/components/emoji-picker/EmojiPicker.css` | `src/app/components/EmojiPicker/EmojiPicker.css` |
| `src/components/settings-modal/SettingsModal.css` | `src/app/components/SettingsModal/SettingsModal.css` |

Update the CSS import in each `.tsx` file to reference the co-located `.css` file: `import './Tree.css'`.

### Step 15: Delete old files

After all migrations are complete and verified:

| Delete | Reason |
|--------|--------|
| `src/index.js` | Replaced by `src/index.tsx` |
| `src/index.css` | Keep — still needed until Agent 3 |
| `src/App.js` | Replaced by `Debugger.tsx` |
| `src/App.css` | Copied to new location |
| `src/assets/emojis.js` | Moved to `shared/constants/emojis.ts` |
| `src/components/` (entire old directory) | All moved to new locations |

### Step 16: Delete `PullButton`

Looking at the current code, `PullButton.js` (`components/pull-button/PullButton.js`) is not imported or used by any component (the refresh/pull functionality is handled by `ColorReset`). Do not migrate it — just delete it.

---

## Step 17: Verify

1. `cd frontend && npm run dev` — Webpack dev server starts on port 3000 without errors
2. TypeScript compiles with no errors
3. The UI loads and displays the project tree
4. Toggle, color picker, emoji picker all work
5. Save/refresh buttons work
6. Settings modal opens and functions correctly
7. All imports use `@/` path alias (no relative `../../` chains)

---

## Files Created

| File | Description |
|------|-------------|
| `frontend/webpack.config.js` | Webpack 5 config (from template) |
| `frontend/tsconfig.json` | TypeScript config (from template) |
| `frontend/src/index.tsx` | New entry point with `createRoot` |
| `frontend/src/types/index.ts` | Shared TypeScript interfaces |
| `frontend/src/app/Main.tsx` | Root component wrapper |
| `frontend/src/app/pages/Debugger/Debugger.tsx` | Main debugger page (from App.js) |
| `frontend/src/app/pages/Debugger/Debugger.css` | Temporary CSS (from App.css) |
| `frontend/src/app/pages/Debugger/DebuggerHeader.tsx` | Extracted header component |
| `frontend/src/app/components/Tree/Tree.tsx` | Migrated + typed |
| `frontend/src/app/components/Tree/TreeNode.tsx` | Migrated + typed |
| `frontend/src/app/components/SyncSection/SyncSection.tsx` | Migrated + typed |
| `frontend/src/app/components/SyncSection/PushButton.tsx` | Migrated + typed |
| `frontend/src/app/components/SyncSection/ColorReset.tsx` | Migrated + typed |
| `frontend/src/app/components/EmojiPicker/EmojiPicker.tsx` | Migrated + typed |
| `frontend/src/app/components/SettingsModal/SettingsModal.tsx` | Migrated + typed |
| `frontend/src/shared/state/API_ENDPOINTS.ts` | Centralized API URLs |
| `frontend/src/shared/hooks.ts` | Stub (Agent 3 fills in) |
| `frontend/src/shared/constants/emojis.ts` | Emoji data (from assets/emojis.js) |
| Various `.css` files in new locations | Temporary copies |

## Files Modified

| File | Change |
|------|--------|
| `frontend/package.json` | Full rewrite — Webpack, TS, MUI v7 |
| `frontend/run.sh` | `npm run start` → `npm run dev` |

## Files Deleted

| File | Reason |
|------|--------|
| `frontend/src/index.js` | Replaced by `index.tsx` |
| `frontend/src/App.js` | Replaced by `Debugger.tsx` |
| `frontend/src/App.css` | Copied to new location |
| `frontend/src/assets/emojis.js` | Moved to `shared/constants/emojis.ts` |
| `frontend/src/components/` (entire directory) | All migrated to new structure |
