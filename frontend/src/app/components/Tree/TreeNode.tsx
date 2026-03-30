import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import EmojiPicker from '@/app/components/EmojiPicker/EmojiPicker';
import { TreeNodeData, ExpandedState } from '@/types';
import './TreeNode.css';

const PRESETS = ['#ffffff', '#c4633a', '#dc3c3c', '#e67e22', '#f1c40f', '#4aba6a', '#1abc9c', '#4a9aba', '#9b59b6'];

interface ColorPickerPopupProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({ color, onChange, onClose }) => {
  const [hex, setHex] = useState(color);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHex(color); }, [color]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleHexInput = (val: string) => {
    setHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="color-picker-panel" ref={panelRef}>
      <HexColorPicker color={color} onChange={onChange} />
      <div className="color-picker-presets">
        {PRESETS.map(c => (
          <button
            key={c}
            className={`color-picker-swatch ${c === color ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="color-picker-hex-row">
        <span className="color-picker-hash">#</span>
        <input
          className="color-picker-hex-input"
          value={hex.replace('#', '')}
          onChange={e => handleHexInput('#' + e.target.value)}
          maxLength={6}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

interface TreeNodeProps {
  node: TreeNodeData;
  nodeId: string;
  expanded: ExpandedState;
  handleExpandClick: (id: string) => void;
  handleCheckboxChange: (nodeId: string, checked: boolean) => void;
  handleColorChange: (nodeId: string, color: string) => void;
  handleEmojiChange: (nodeId: string, emoji: string) => void;
  renderTree: (node: TreeNodeData, parentId: string) => React.ReactNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  nodeId,
  expanded,
  handleExpandClick,
  handleCheckboxChange,
  handleColorChange,
  handleEmojiChange,
  renderTree,
}) => {
  const isDirectory = node.children && node.children.length > 0;
  const isExpanded = expanded[nodeId];
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!isDirectory) return;
    if ((e.target as HTMLElement).closest('.node-checkbox, .picker-wrapper, .color-trigger')) return;
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

        <EmojiPicker
          defaultEmoji={node.emoji}
          handleEmojiChange={(emoji: string) => handleEmojiChange(nodeId, emoji)}
        />

        <div className="tree-node-name-area">
          <span
            className={`tree-node-name ${isDirectory ? 'is-directory' : ''}`}
            style={{ color: node.color || 'var(--text-primary)' }}
          >
            {node.name}
          </span>
          <div className="color-trigger" onClick={e => e.stopPropagation()}>
            <button
              className="color-trigger-icon"
              onClick={() => setShowColorPicker(prev => !prev)}
              style={{ color: node.color || 'var(--text-tertiary)' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
            </button>
            {showColorPicker && (
              <ColorPickerPopup
                color={node.color || '#ffffff'}
                onChange={(color: string) => handleColorChange(nodeId, color)}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </div>
        </div>

        <label className="node-checkbox" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={node.is_toggled}
            onChange={(e) => handleCheckboxChange(nodeId, e.target.checked)}
          />
          <span className="node-checkbox-box">
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2.5 6 5 8.5 9.5 3.5" />
            </svg>
          </span>
        </label>
      </div>

      {isDirectory && isExpanded && (
        <div className="tree-node-children">
          {node.children!.map((childNode) => renderTree(childNode, nodeId))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
