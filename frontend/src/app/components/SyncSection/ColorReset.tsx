import React from 'react';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { pullWithRetry } from '@/shared/state/debuggerSlice';

const ColorReset: React.FC = () => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const dirty = useAppSelector((s) => s.debugger.dirty);

  return (
    <Button
      onClick={() => dispatch(pullWithRetry())}
      disabled={!dirty}
      size="small"
      sx={{
        height: 32,
        px: 1.5,
        gap: 0.75,
        bgcolor: 'transparent',
        color: c.text.tertiary,
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
      <RefreshIcon sx={{ fontSize: 16 }} />
      Refresh
    </Button>
  );
};

export default ColorReset;
