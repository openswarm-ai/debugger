import React, { useState, useEffect } from 'react';
import SyncSection from './components/sync-section/SyncSection';
import Tree from './components/tree/Tree';
import './App.css';

const App = () => {
    const [projectStructure, setProjectStructure] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [theme, setTheme] = useState(() => localStorage.getItem('debugger-theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('debugger-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="app-title">
                    <span className="app-title-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </span>
                    Debugger
                </div>
                <div className="app-actions">
                    <SyncSection projectStructure={projectStructure} setProjectStructure={setProjectStructure} />
                    <div className="header-divider" />
                    <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {theme === 'dark' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        )}
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
                        <p>Pull your project's debug configuration using the download button in the toolbar above.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
