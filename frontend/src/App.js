import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import SyncSection from './components/sync-section/SyncSection';
import SettingsModal from './components/settings-modal/SettingsModal';
import Tree from './components/tree/Tree';
import './App.css';

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '8324';
const API_BASE = `http://127.0.0.1:${BACKEND_PORT}/api/debugger`;

const DEFAULT_SETTINGS = {
    pullRetryCount: 3,
    pullRetryDelay: 2,
    autoSave: false,
    defaultExpanded: true,
};

const buildExpandedState = (nodes, parentId = '') => {
    const result = {};
    if (!Array.isArray(nodes)) return result;
    nodes.forEach(node => {
        const nodeId = parentId ? `${parentId}/${node.name}` : node.name;
        if (node.children && node.children.length > 0) {
            result[nodeId] = true;
            Object.assign(result, buildExpandedState(node.children, nodeId));
        }
    });
    return result;
};

const App = () => {
    const [projectStructure, setProjectStructure] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle');
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('debugger-settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const projectStructureRef = useRef(null);
    const dirtyRef = useRef(false);
    const autoSaveTimerRef = useRef(null);
    const savedTimerRef = useRef(null);
    const settingsRef = useRef(settings);

    useEffect(() => { settingsRef.current = settings; }, [settings]);
    useEffect(() => { projectStructureRef.current = projectStructure; }, [projectStructure]);
    useEffect(() => { localStorage.setItem('debugger-settings', JSON.stringify(settings)); }, [settings]);

    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        };
    }, []);

    const pullStructure = useCallback(async () => {
        const response = await axios.get(`${API_BASE}/pull_structure`);
        return response.data;
    }, []);

    const pullWithRetry = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { pullRetryCount, pullRetryDelay } = settingsRef.current;

        for (let attempt = 1; attempt <= pullRetryCount; attempt++) {
            try {
                const data = await pullStructure();
                setProjectStructure(data);
                if (settingsRef.current.defaultExpanded) {
                    setExpanded(buildExpandedState(data));
                } else {
                    setExpanded({});
                }
                setLoading(false);
                return true;
            } catch (err) {
                if (attempt < pullRetryCount) {
                    await new Promise(resolve => setTimeout(resolve, pullRetryDelay * 1000));
                }
            }
        }

        setError(
            `Failed to connect to the backend after ${pullRetryCount} attempt${pullRetryCount !== 1 ? 's' : ''}. ` +
            `Make sure the server is running on port ${BACKEND_PORT}.`
        );
        setLoading(false);
        return false;
    }, [pullStructure]);

    useEffect(() => { pullWithRetry(); }, [pullWithRetry]);

    const handleSave = useCallback(async () => {
        const current = projectStructureRef.current;
        if (!current) return;
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        setSaveStatus('saving');
        try {
            await axios.post(`${API_BASE}/push_structure`, { projectStructure: current });
            const data = await pullStructure();
            setProjectStructure(data);
            dirtyRef.current = false;
            setDirty(false);
            setSaveStatus('saved');
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (err) {
            console.error('Error saving project structure:', err);
            setSaveStatus('idle');
        }
    }, [pullStructure]);

    const handleRefresh = useCallback(async () => {
        try {
            const data = await pullStructure();
            setProjectStructure(data);
            if (settingsRef.current.defaultExpanded) {
                setExpanded(buildExpandedState(data));
            } else {
                setExpanded({});
            }
            dirtyRef.current = false;
            setDirty(false);
            setSaveStatus('idle');
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        } catch (err) {
            console.error('Error refreshing project structure:', err);
        }
    }, [pullStructure]);

    const handleResetColors = useCallback(async () => {
        try {
            const response = await axios.post(`${API_BASE}/reset_color`);
            setProjectStructure(response.data);
            projectStructureRef.current = response.data;
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            setSaveStatus('saving');
            await axios.post(`${API_BASE}/push_structure`, { projectStructure: response.data });
            const fresh = await pullStructure();
            setProjectStructure(fresh);
            dirtyRef.current = false;
            setDirty(false);
            setSaveStatus('saved');
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (err) {
            console.error('Error resetting colors:', err);
            setSaveStatus('idle');
        }
    }, [pullStructure]);

    const handleResetEmojis = useCallback(async () => {
        try {
            const response = await axios.post(`${API_BASE}/reset_emoji`);
            setProjectStructure(response.data);
            projectStructureRef.current = response.data;
            if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
            setSaveStatus('saving');
            await axios.post(`${API_BASE}/push_structure`, { projectStructure: response.data });
            const fresh = await pullStructure();
            setProjectStructure(fresh);
            dirtyRef.current = false;
            setDirty(false);
            setSaveStatus('saved');
            savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (err) {
            console.error('Error resetting emojis:', err);
            setSaveStatus('idle');
        }
    }, [pullStructure]);

    const triggerAutoSave = useCallback(() => {
        if (!settingsRef.current.autoSave) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
            if (dirtyRef.current) handleSave();
        }, 1500);
    }, [handleSave]);

    const markDirty = useCallback(() => {
        dirtyRef.current = true;
        setDirty(true);
        setSaveStatus('idle');
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        triggerAutoSave();
    }, [triggerAutoSave]);

    const handleExpandClick = (id) => {
        setExpanded((prevExpanded) => ({ ...prevExpanded, [id]: !prevExpanded[id] }));
    };

    const handleCheckboxChange = (nodeId, checked) => {
        const updateNode = (nodes, pathParts, checked, forceCheck = false) => {
            return nodes.map((node) => {
                if (node.name === pathParts[0]) {
                    const shouldCheck = checked || forceCheck;
                    if (pathParts.length === 1) {
                        return { ...node, is_toggled: shouldCheck, children: updateChildren(node.children, shouldCheck) };
                    }
                    if (node.children) {
                        const updatedChildren = updateNode(node.children, pathParts.slice(1), checked, shouldCheck);
                        return { ...node, is_toggled: shouldCheck, children: updatedChildren };
                    }
                    return { ...node, is_toggled: shouldCheck };
                }
                return node;
            });
        };

        const updateChildren = (children, checked) => {
            if (!children) return [];
            return children.map((child) => ({
                ...child,
                is_toggled: checked,
                children: updateChildren(child.children, checked)
            }));
        };

        setProjectStructure((prevStructure) => {
            if (!prevStructure) return prevStructure;
            const pathParts = nodeId.split('/');
            return updateNode(prevStructure, pathParts, checked);
        });
        markDirty();
    };

    const handleEmojiChange = (nodeId, emoji) => {
        const propagateEmojiToChildren = (node) => {
            if (!node.children) return node;
            const updatedChildren = node.children.map((child) => ({
                ...child,
                emoji,
                children: propagateEmojiToChildren(child).children,
            }));
            return { ...node, children: updatedChildren };
        };

        const updateNode = (nodes, pathParts, emoji) => {
            return nodes.map((node) => {
                if (node.name === pathParts[0]) {
                    let updatedNode = { ...node };
                    if (pathParts.length === 1) {
                        updatedNode.emoji = emoji;
                    }
                    if (node.children && pathParts.length > 1) {
                        const updatedChildren = updateNode(node.children, pathParts.slice(1), emoji);
                        updatedNode = { ...updatedNode, children: updatedChildren };
                    }
                    if (pathParts.length === 1 && node.children) {
                        updatedNode.children = propagateEmojiToChildren(node).children;
                    }
                    return updatedNode;
                }
                return node;
            });
        };

        setProjectStructure((prevStructure) => {
            if (!prevStructure) return prevStructure;
            const pathParts = nodeId.split('/');
            return updateNode(prevStructure, pathParts, emoji);
        });
        markDirty();
    };

    const handleColorChange = (nodeId, color) => {
        const amount = 50;

        const lightenColor = (color, amt = 50) => {
            if (!color || typeof color !== 'string' || !color.startsWith('#') || color.length !== 7) {
                return '#ffffff';
            }
            const colorInt = parseInt(color.slice(1), 16);
            const r = Math.min(255, (colorInt >> 16) + amt);
            const g = Math.min(255, ((colorInt >> 8) & 0x00FF) + amt);
            const b = Math.min(255, (colorInt & 0x0000FF) + amt);
            return `#${((r << 16) + (g << 8) + b).toString(16).padStart(6, '0')}`;
        };

        const updateNode = (nodes, pathParts, color, isOriginalParent = false) => {
            return nodes.map((node) => {
                if (node.name === pathParts[0]) {
                    let newColor = node.color;
                    let set_manually = node.set_manually;

                    if (pathParts.length === 1) {
                        if (isOriginalParent) set_manually = true;
                        newColor = color;
                    }

                    if (node.children) {
                        const updatedChildren = updateNode(node.children, pathParts.slice(1), color, isOriginalParent);
                        const propagatedChildren = updatedChildren.map((child) => {
                            if (!child.set_manually) {
                                const newPath = [...pathParts.slice(1), child.name];
                                return updateNode([child], newPath, lightenColor(color, amount), false)[0];
                            }
                            return child;
                        });
                        return { ...node, color: newColor, is_toggled: node.is_toggled, set_manually, children: propagatedChildren };
                    }
                    return { ...node, color: newColor, is_toggled: node.is_toggled, set_manually };
                }
                return node;
            });
        };

        setProjectStructure((prevStructure) => {
            if (!prevStructure) return prevStructure;
            const pathParts = nodeId.split('/');
            return updateNode(prevStructure, pathParts, color, true);
        });
        markDirty();
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="app-title">
                    <img src="/logo.png" alt="Open Swarm" className="app-logo" />
                    Debugger
                </div>
                <div className="app-actions">
                    <SyncSection
                        onSave={handleSave}
                        onRefresh={handleRefresh}
                        dirty={dirty}
                        saveStatus={saveStatus}
                    />
                    <button className="toolbar-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        Settings
                    </button>
                </div>
            </header>

            <main className="app-main">
                {projectStructure ? (
                    <div className="tree-card">
                        <Tree
                            projectStructure={projectStructure}
                            expanded={expanded}
                            handleExpandClick={handleExpandClick}
                            handleCheckboxChange={handleCheckboxChange}
                            handleColorChange={handleColorChange}
                            handleEmojiChange={handleEmojiChange}
                        />
                    </div>
                ) : loading ? (
                    <div className="empty-state">
                        <div className="empty-state-icon loading-pulse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        </div>
                        <h3>Connecting...</h3>
                        <p>Loading your project's debug configuration.</p>
                    </div>
                ) : error ? (
                    <div className="empty-state">
                        <div className="empty-state-icon error-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3>Connection failed</h3>
                        <p>{error}</p>
                        <button className="retry-btn" onClick={pullWithRetry}>Retry</button>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </div>
                        <h3>No configuration loaded</h3>
                        <p>Could not load your project's debug configuration.</p>
                    </div>
                )}
            </main>

            {showSettings && (
                <SettingsModal
                    settings={settings}
                    setSettings={setSettings}
                    onResetColors={handleResetColors}
                    onResetEmojis={handleResetEmojis}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    );
};

export default App;
