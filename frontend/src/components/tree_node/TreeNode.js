import React from 'react';
import EmojiPicker from '../emoji-picker/EmojiPicker';
import './TreeNode.css';

const TreeNode = ({ node, nodeId, expanded, handleExpandClick, handleCheckboxChange, handleColorChange, handleEmojiChange, renderTree }) => {
    const isDirectory = node.children && node.children.length > 0;
    const isExpanded = expanded[nodeId];

    const handleRowClick = (e) => {
        if (!isDirectory) return;
        if (e.target.closest('.toggle-switch, .picker-wrapper, .color-dot-wrapper')) return;
        handleExpandClick(nodeId);
    };

    return (
        <div className="tree-node">
            <div
                className={`tree-node-row ${!node.is_toggled ? 'toggled-off' : ''} ${isDirectory ? 'is-expandable' : ''}`}
                onClick={handleRowClick}
            >
                {isDirectory ? (
                    <span className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                ) : (
                    <span className="expand-spacer" />
                )}

                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={node.is_toggled}
                        onChange={(e) => handleCheckboxChange(nodeId, e.target.checked)}
                    />
                    <span className="toggle-track">
                        <span className="toggle-thumb" />
                    </span>
                </label>

                <EmojiPicker
                    defaultEmoji={node.emoji}
                    handleEmojiChange={(emoji) => handleEmojiChange(nodeId, emoji)}
                />

                <span
                    className={`tree-node-name ${isDirectory ? 'is-directory' : ''}`}
                    style={{ color: node.color || 'var(--text-primary)' }}
                >
                    {node.name}
                </span>

                <div className="color-dot-wrapper">
                    <input
                        type="color"
                        value={node.color || '#ffffff'}
                        onChange={(e) => handleColorChange(nodeId, e.target.value)}
                        id={`color-${nodeId}`}
                    />
                    <label
                        htmlFor={`color-${nodeId}`}
                        className="color-dot"
                        style={{ backgroundColor: node.color || '#ffffff' }}
                    />
                </div>
            </div>

            {isDirectory && isExpanded && (
                <div className="tree-node-children">
                    {node.children.map((childNode) => renderTree(childNode, nodeId))}
                </div>
            )}
        </div>
    );
};

export default TreeNode;
