import React from 'react';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { updateSettings, setShowSettings } from '@/shared/state/debuggerSlice';
import { DebuggerSettings } from '@/types';
import NumberStepperField from './NumberStepperField';
import SwitchSettingRow from './SwitchSettingRow';
import ResetDefaultsSection from './ResetDefaultsSection';

const SettingsModal: React.FC = () => {
  const c = useClaudeTokens();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.debugger.settings);

  const handleClose = () => dispatch(setShowSettings(false));

  const handleChange = (key: keyof DebuggerSettings, value: DebuggerSettings[keyof DebuggerSettings]) => {
    dispatch(updateSettings({ [key]: value }));
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
          <NumberStepperField
            label="Pull Retry Count"
            description="Number of connection attempts on startup"
            value={settings.pullRetryCount}
            min={1}
            max={20}
            onChange={(v) => handleChange('pullRetryCount', v)}
          />
          <NumberStepperField
            label="Pull Retry Delay (seconds)"
            description="Wait time between retry attempts"
            value={settings.pullRetryDelay}
            min={1}
            max={30}
            onChange={(v) => handleChange('pullRetryDelay', v)}
          />
          <SwitchSettingRow
            label="Auto Save"
            description="Automatically save changes after editing"
            checked={settings.autoSave}
            onChange={() => handleChange('autoSave', !settings.autoSave)}
          />
          <SwitchSettingRow
            label="Expand All on Load"
            description="Start with all directories expanded when the tree loads"
            checked={settings.defaultExpanded}
            onChange={() => handleChange('defaultExpanded', !settings.defaultExpanded)}
          />
          <ResetDefaultsSection />
        </DialogContent>
      </motion.div>
    </Dialog>
  );
};

export default SettingsModal;
