import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PaletteIcon from '@mui/icons-material/Palette';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { motion, AnimatePresence } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch } from '@/shared/hooks';
import { resetColors, resetEmojis } from '@/shared/state/debuggerSlice';

const ResetDefaultsSection: React.FC = () => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleConfirm = () => {
    if (confirmAction === 'colors') dispatch(resetColors());
    if (confirmAction === 'emojis') dispatch(resetEmojis());
    setConfirmAction(null);
  };

  const resetBtnSx = {
    textTransform: 'none' as const,
    fontSize: '0.8rem',
    color: c.text.secondary,
    borderColor: c.border.medium,
    '&:hover': {
      color: c.status.error,
      borderColor: c.status.error,
      bgcolor: c.status.errorBg,
    },
    transition: c.transition,
  };

  return (
    <Box
      sx={{
        mt: 2.5,
        p: 2,
        bgcolor: c.bg.page,
        borderRadius: `${c.radius.md}px`,
        border: `1px solid ${c.border.subtle}`,
      }}
    >
      <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
        Reset Defaults
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25, mb: 1.5 }}>
        Revert all nodes back to their default values and save
      </Typography>

      <AnimatePresence mode="wait">
        {confirmAction ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: c.status.errorBg,
                borderRadius: `${c.radius.md}px`,
                border: `1px solid ${c.border.subtle}`,
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', color: c.text.secondary, mb: 1 }}>
                Reset all {confirmAction} to defaults?
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setConfirmAction(null)}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: c.text.tertiary,
                    '&:hover': { bgcolor: c.bg.elevated },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: c.status.error,
                    fontWeight: 600,
                    '&:hover': { bgcolor: c.status.errorBg },
                  }}
                >
                  Confirm
                </Button>
              </Box>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={() => setConfirmAction('colors')}
                variant="outlined"
                startIcon={<PaletteIcon sx={{ fontSize: 16 }} />}
                size="small"
                sx={resetBtnSx}
              >
                Reset Colors
              </Button>
              <Button
                onClick={() => setConfirmAction('emojis')}
                variant="outlined"
                startIcon={<EmojiEmotionsIcon sx={{ fontSize: 16 }} />}
                size="small"
                sx={resetBtnSx}
              >
                Reset Emojis
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ResetDefaultsSection;
