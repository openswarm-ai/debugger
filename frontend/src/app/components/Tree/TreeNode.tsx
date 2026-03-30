import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import { HexColorPicker } from 'react-colorful';
import { motion } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { toggleExpanded, checkboxChange, colorChange } from '@/shared/state/debuggerSlice';
import EmojiPicker from '@/app/components/EmojiPicker/EmojiPicker';
import { TreeNodeData } from '@/types';

const PRESETS = ['#ffffff', '#c4633a', '#dc3c3c', '#e67e22', '#f1c40f', '#4aba6a', '#1abc9c', '#4a9aba', '#9b59b6'];

interface ColorPickerPopupProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const ColorPickerPopup: React.FC<ColorPickerPopupProps> = ({ color, onChange, onClose }) => {
  const c = useClaudeTokens();
  const [hex, setHex] = useState(color);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setHex(color); }, [color]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleHexInput = (val: string) => {
    setHex(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <Box
        ref={panelRef}
        sx={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 1000,
          p: 1.5,
          bgcolor: c.bg.elevated,
          border: `1px solid ${c.border.medium}`,
          borderRadius: `${c.radius.xl}px`,
          boxShadow: c.shadow.lg,
          '& .react-colorful': { width: '100%', height: 150 },
          '& .react-colorful__saturation': { borderRadius: `${c.radius.md}px ${c.radius.md}px 0 0` },
          '& .react-colorful__hue': { borderRadius: `0 0 ${c.radius.md}px ${c.radius.md}px` },
        }}
      >
        <HexColorPicker color={color} onChange={onChange} />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
          {PRESETS.map((preset) => (
            <Box
              key={preset}
              component="button"
              onClick={() => onChange(preset)}
              sx={{
                width: 22,
                height: 22,
                borderRadius: `${c.radius.xs}px`,
                bgcolor: preset,
                border: preset === color ? `2px solid ${c.text.primary}` : `1px solid ${c.border.medium}`,
                cursor: 'pointer',
                p: 0,
                transition: c.transition,
                '&:hover': { transform: 'scale(1.15)' },
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
          <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary }}>#</Typography>
          <Box
            component="input"
            value={hex.replace('#', '')}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleHexInput('#' + e.target.value)}
            maxLength={6}
            spellCheck={false}
            sx={{
              flex: 1,
              height: 28,
              px: 0.75,
              bgcolor: c.bg.surface,
              border: `1px solid ${c.border.medium}`,
              borderRadius: `${c.radius.sm}px`,
              color: c.text.primary,
              fontFamily: c.font.mono,
              fontSize: '0.75rem',
              outline: 'none',
              '&:focus': { borderColor: c.accent.primary },
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
};

interface TreeNodeProps {
  node: TreeNodeData;
  nodeId: string;
  renderTree: (node: TreeNodeData, parentId: string, index: number, depth: number) => React.ReactNode;
  index: number;
  depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, nodeId, renderTree, index, depth }) => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const isExpanded = useAppSelector((s) => s.debugger.expanded[nodeId]);
  const isDirectory = node.children && node.children.length > 0;
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!isDirectory) return;
    if ((e.target as HTMLElement).closest('[data-no-row-click]')) return;
    dispatch(toggleExpanded(nodeId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Box sx={{ width: '100%' }}>
        <Box
          onClick={handleRowClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.25,
            py: 0.625,
            borderRadius: `${c.radius.md}px`,
            cursor: isDirectory ? 'pointer' : 'default',
            minHeight: 36,
            transition: c.transition,
            '&:hover': { bgcolor: c.bg.elevated },
            '&:hover .checkbox-reveal': { opacity: 1 },
            '&:hover .color-picker-reveal': { opacity: 0.7 },
          }}
        >
          <Box
            data-no-row-click
            className="checkbox-reveal"
            sx={{
              opacity: node.is_toggled ? 0.3 : 0.6,
              transition: c.transition,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Checkbox
              checked={node.is_toggled}
              onChange={(e) => dispatch(checkboxChange({ nodeId, checked: e.target.checked }))}
              size="small"
              sx={{
                p: 0,
                color: c.text.tertiary,
                '&.Mui-checked': { color: c.accent.primary },
              }}
            />
          </Box>

          <Box data-no-row-click sx={{ ml: depth * 3 }}>
            <EmojiPicker
              defaultEmoji={node.emoji}
              handleEmojiChange={(emoji: string) =>
                dispatch({ type: 'debugger/emojiChange', payload: { nodeId, emoji } })
              }
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 0.5, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontFamily: c.font.mono,
                fontWeight: isDirectory ? 600 : 400,
                color: node.color || c.text.primary,
                opacity: node.is_toggled ? 1 : 0.38,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: c.transition,
              }}
            >
              {node.name}
            </Typography>
            <Box data-no-row-click sx={{ position: 'relative' }}>
              <Tooltip title="Change color">
                <IconButton
                  size="small"
                  className="color-picker-reveal"
                  onClick={() => setShowColorPicker((prev) => !prev)}
                  sx={{
                    color: node.color || c.text.tertiary,
                    opacity: 0,
                    '&:focus': { opacity: 0.7 },
                    '&:hover': { color: c.accent.primary, opacity: 1 },
                    transition: c.transition,
                    p: 0.25,
                  }}
                >
                  <InvertColorsIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              {showColorPicker && (
                <ColorPickerPopup
                  color={node.color || '#ffffff'}
                  onChange={(col: string) => dispatch(colorChange({ nodeId, color: col }))}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </Box>
          </Box>

          {isDirectory && (
            <ChevronRightIcon
              sx={{
                fontSize: 18,
                color: c.text.tertiary,
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms ease',
                flexShrink: 0,
              }}
            />
          )}
        </Box>

        {isDirectory && isExpanded && (
          <Box>
            {node.children!.map((childNode, childIndex) => renderTree(childNode, nodeId, childIndex, depth + 1))}
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

export default TreeNode;
