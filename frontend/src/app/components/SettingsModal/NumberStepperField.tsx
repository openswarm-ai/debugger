import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';

interface NumberStepperFieldProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const NumberStepperField: React.FC<NumberStepperFieldProps> = ({
  label,
  description,
  value,
  min,
  max,
  onChange,
}) => {
  const c = useClaudeTokens();

  const stepperBtnSx = {
    p: 0,
    minWidth: 0,
    width: 18,
    height: 14,
    color: c.text.muted,
    borderRadius: `${c.radius.xs}px`,
    '&:hover': { color: c.text.primary, bgcolor: `${c.accent.primary}12` },
    transition: 'color 0.15s, background-color 0.15s',
  };

  const numberFieldSx = {
    width: 80,
    '& .MuiInputBase-root': {
      height: 36,
      bgcolor: c.bg.page,
      borderRadius: `${c.radius.sm}px`,
      fontFamily: c.font.mono,
      fontSize: '0.85rem',
      pr: 0.5,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: c.border.medium,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: c.border.strong,
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: c.accent.primary,
    },
    '& input': { color: c.text.primary, textAlign: 'center' as const },
    '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '& input[type=number]': { MozAppearance: 'textfield' },
  };

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
      <TextField
        type="number"
        value={value}
        onChange={(e) => {
          const v = Math.max(min, Math.min(max, parseInt(e.target.value) || min));
          onChange(v);
        }}
        size="small"
        inputProps={{ min, max }}
        sx={numberFieldSx}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <IconButton
                    size="small"
                    onClick={() => onChange(Math.min(max, value + 1))}
                    sx={stepperBtnSx}
                  >
                    <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    sx={stepperBtnSx}
                  >
                    <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
};

export default NumberStepperField;
