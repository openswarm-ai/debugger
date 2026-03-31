import React, { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { HexColorPicker } from 'react-colorful';
import { motion } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';

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

export default ColorPickerPopup;
