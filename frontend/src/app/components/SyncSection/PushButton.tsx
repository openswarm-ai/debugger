import React from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import { AnimatePresence, motion } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { pushStructure } from '@/shared/state/debuggerSlice';

const PushButton: React.FC = () => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const dirty = useAppSelector((s) => s.debugger.dirty);
  const saveStatus = useAppSelector((s) => s.debugger.saveStatus);

  const isSaving = saveStatus === 'saving';
  const isSaved = saveStatus === 'saved';
  const disabled = (!dirty && saveStatus === 'idle') || isSaving;

  return (
    <Button
      onClick={() => dispatch(pushStructure())}
      disabled={disabled}
      size="small"
      sx={{
        height: 32,
        px: 1.5,
        gap: 0.75,
        bgcolor: 'transparent',
        color: isSaved ? c.status.success : c.text.tertiary,
        textTransform: 'none',
        fontFamily: 'inherit',
        fontSize: '0.8rem',
        fontWeight: 500,
        borderRadius: `${c.radius.md}px`,
        whiteSpace: 'nowrap',
        transition: c.transition,
        '&:hover:not(:disabled)': { bgcolor: c.bg.elevated, color: c.text.primary },
        '&:active:not(:disabled)': { transform: 'scale(0.97)' },
        '&:disabled': { opacity: 0.3 },
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={saveStatus}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isSaving ? (
            <CircularProgress size={16} sx={{ color: c.text.tertiary }} />
          ) : isSaved ? (
            <CheckIcon sx={{ fontSize: 16 }} />
          ) : (
            <SaveIcon sx={{ fontSize: 16 }} />
          )}
          {isSaving ? 'Saving' : isSaved ? 'Saved' : 'Save'}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};

export default PushButton;
