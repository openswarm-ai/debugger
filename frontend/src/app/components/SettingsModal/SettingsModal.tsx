import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PaletteIcon from '@mui/icons-material/Palette';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { motion, AnimatePresence } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import {
  updateSettings,
  resetColors,
  resetEmojis,
  setShowSettings,
} from '@/shared/state/debuggerSlice';
import { DebuggerSettings } from '@/types';

const SettingsModal: React.FC = () => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.debugger.settings);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleClose = () => dispatch(setShowSettings(false));

  const handleChange = (key: keyof DebuggerSettings, value: DebuggerSettings[keyof DebuggerSettings]) => {
    dispatch(updateSettings({ [key]: value }));
  };

  const handleConfirm = () => {
    if (confirmAction === 'colors') dispatch(resetColors());
    if (confirmAction === 'emojis') dispatch(resetEmojis());
    setConfirmAction(null);
  };

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

  const accentSwitchSx = {
    '& .MuiSwitch-switchBase.Mui-checked': { color: c.accent.primary },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: c.accent.primary },
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: c.bg.surface,
          backgroundImage: 'none',
          border: `1px solid ${c.border.subtle}`,
          boxShadow: c.shadow.lg,
          maxWidth: 440,
          width: '100%',
          overflow: 'hidden',
        },
      }}
      slotProps={{
        backdrop: { sx: { backdropFilter: 'blur(4px)' } },
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${c.border.subtle}`,
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, fontFamily: c.font.serif }}>
            Settings
          </Typography>
          <Tooltip title="Close">
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: c.text.tertiary,
                '&:hover': { color: c.text.primary },
                transition: c.transition,
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
                Pull Retry Count
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25 }}>
                Number of connection attempts on startup
              </Typography>
            </Box>
            <TextField
              type="number"
              value={settings.pullRetryCount}
              onChange={(e) => {
                const v = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                handleChange('pullRetryCount', v);
              }}
              size="small"
              inputProps={{ min: 1, max: 20 }}
              sx={numberFieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleChange('pullRetryCount', Math.min(20, settings.pullRetryCount + 1))}
                          sx={stepperBtnSx}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleChange('pullRetryCount', Math.max(1, settings.pullRetryCount - 1))}
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

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
                Pull Retry Delay (seconds)
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25 }}>
                Wait time between retry attempts
              </Typography>
            </Box>
            <TextField
              type="number"
              value={settings.pullRetryDelay}
              onChange={(e) => {
                const v = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                handleChange('pullRetryDelay', v);
              }}
              size="small"
              inputProps={{ min: 1, max: 30 }}
              sx={numberFieldSx}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleChange('pullRetryDelay', Math.min(30, settings.pullRetryDelay + 1))}
                          sx={stepperBtnSx}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleChange('pullRetryDelay', Math.max(1, settings.pullRetryDelay - 1))}
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

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
                Auto Save
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25 }}>
                Automatically save changes after editing
              </Typography>
            </Box>
            <Switch
              checked={settings.autoSave}
              onChange={() => handleChange('autoSave', !settings.autoSave)}
              size="small"
              sx={accentSwitchSx}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: c.text.primary }}>
                Expand All on Load
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: c.text.tertiary, mt: 0.25 }}>
                Start with all directories expanded when the tree loads
              </Typography>
            </Box>
            <Switch
              checked={settings.defaultExpanded}
              onChange={() => handleChange('defaultExpanded', !settings.defaultExpanded)}
              size="small"
              sx={accentSwitchSx}
            />
          </Box>

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
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        color: c.text.secondary,
                        borderColor: c.border.medium,
                        '&:hover': {
                          color: c.status.error,
                          borderColor: c.status.error,
                          bgcolor: c.status.errorBg,
                        },
                        transition: c.transition,
                      }}
                    >
                      Reset Colors
                    </Button>
                    <Button
                      onClick={() => setConfirmAction('emojis')}
                      variant="outlined"
                      startIcon={<EmojiEmotionsIcon sx={{ fontSize: 16 }} />}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        color: c.text.secondary,
                        borderColor: c.border.medium,
                        '&:hover': {
                          color: c.status.error,
                          borderColor: c.status.error,
                          bgcolor: c.status.errorBg,
                        },
                        transition: c.transition,
                      }}
                    >
                      Reset Emojis
                    </Button>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
};

export default SettingsModal;
