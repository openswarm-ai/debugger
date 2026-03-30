import React from 'react';
import Box from '@mui/material/Box';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import PushButton from '@/app/components/SyncSection/PushButton';
import ColorReset from '@/app/components/SyncSection/ColorReset';

const SyncSection: React.FC = () => {
  const c = useClaudeTokens();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <ColorReset />
      <PushButton />
    </Box>
  );
};

export default SyncSection;
