import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';

interface SwitchSettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const SwitchSettingRow: React.FC<SwitchSettingRowProps> = ({
  label,
  description,
  checked,
  onChange,
}) => {
  const c = useClaudeTokens();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
      <Box>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25 }}>
          {description}
        </Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={onChange}
        size="small"
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': { color: c.accent.primary },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: c.accent.primary },
        }}
      />
    </Box>
  );
};

export default SwitchSettingRow;
