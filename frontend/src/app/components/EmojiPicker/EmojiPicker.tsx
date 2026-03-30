import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { motion } from 'framer-motion';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { emojiList } from '@/shared/constants/emojis';

const EMOJIS_PER_PAGE = 30;

interface EmojiPickerProps {
  defaultEmoji: string;
  handleEmojiChange: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ defaultEmoji, handleEmojiChange }) => {
  const c = useClaudeTokens();
  const folderNames = Object.keys(emojiList);
  const firstFolder = folderNames[0];
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState(defaultEmoji || '⚫');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentFolder, setCurrentFolder] = useState(firstFolder);

  useEffect(() => {
    if (defaultEmoji) setSelectedEmoji(defaultEmoji);
  }, [defaultEmoji]);

  const open = Boolean(anchorEl);

  const handleFolderClick = (folderName: string) => {
    setCurrentFolder(folderName);
    setCurrentPage(0);
  };

  const emojis = currentFolder ? emojiList[currentFolder] : [];
  const totalPages = Math.ceil(emojis.length / EMOJIS_PER_PAGE);
  const currentEmojis = emojis.slice(
    currentPage * EMOJIS_PER_PAGE,
    (currentPage + 1) * EMOJIS_PER_PAGE,
  );

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(emoji);
    setAnchorEl(null);
    handleEmojiChange(emoji);
  };

  const goToNextFolder = () => {
    const idx = folderNames.indexOf(currentFolder);
    if (idx + 1 < folderNames.length) {
      setCurrentFolder(folderNames[idx + 1]);
      setCurrentPage(0);
    }
  };

  const goToPreviousFolder = () => {
    const idx = folderNames.indexOf(currentFolder);
    if (idx - 1 >= 0) {
      const prev = folderNames[idx - 1];
      setCurrentFolder(prev);
      setCurrentPage(Math.ceil(emojiList[prev].length / EMOJIS_PER_PAGE) - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    else goToNextFolder();
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
    else goToPreviousFolder();
  };

  const isLastFolder = currentFolder === folderNames[folderNames.length - 1];
  const isLastPageOfLastFolder = isLastFolder && currentPage === totalPages - 1;
  const isFirstFolder = currentFolder === folderNames[0];
  const isFirstPageOfFirstFolder = isFirstFolder && currentPage === 0;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        sx={{
          width: 28,
          height: 28,
          fontSize: '1rem',
          borderRadius: `${c.radius.sm}px`,
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          lineHeight: 1,
          '&:hover': { bgcolor: `${c.accent.primary}0A` },
          transition: c.transition,
        }}
      >
        {selectedEmoji}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              bgcolor: c.bg.elevated,
              border: `1px solid ${c.border.medium}`,
              borderRadius: `${c.radius.xl}px`,
              boxShadow: c.shadow.lg,
              overflow: 'visible',
            },
          },
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Box sx={{ width: 310, p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={goToPreviousPage}
                disabled={isFirstPageOfFirstFolder}
                sx={{
                  color: c.text.tertiary,
                  '&:hover': { bgcolor: `${c.accent.primary}0A`, color: c.text.primary },
                  '&:disabled': { opacity: 0.25 },
                }}
              >
                <ChevronLeftIcon sx={{ fontSize: 14 }} />
              </IconButton>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 0.25,
                  height: 230,
                  width: '100%',
                  alignContent: 'start',
                }}
              >
                {currentEmojis.map((emoji, idx) => (
                  <Box
                    key={idx}
                    onClick={() => handleEmojiClick(emoji)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      aspectRatio: '1',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      borderRadius: `${c.radius.sm}px`,
                      fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                      lineHeight: 1,
                      userSelect: 'none',
                      transition: 'background 0.1s ease, transform 0.1s ease',
                      '&:hover': { bgcolor: `${c.accent.primary}0A`, transform: 'scale(1.15)' },
                    }}
                  >
                    {emoji}
                  </Box>
                ))}
              </Box>

              <IconButton
                size="small"
                onClick={goToNextPage}
                disabled={isLastPageOfLastFolder}
                sx={{
                  color: c.text.tertiary,
                  '&:hover': { bgcolor: `${c.accent.primary}0A`, color: c.text.primary },
                  '&:disabled': { opacity: 0.25 },
                }}
              >
                <ChevronRightIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                mt: 1,
                pt: 1,
                borderTop: `1px solid ${c.border.subtle}`,
              }}
            >
              {folderNames.map((folderName) => (
                <Box
                  key={folderName}
                  onClick={() => handleFolderClick(folderName)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 28,
                    fontSize: '0.95rem',
                    borderRadius: `${c.radius.sm}px`,
                    cursor: 'pointer',
                    bgcolor: folderName === currentFolder ? c.accent.primary : 'transparent',
                    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                    lineHeight: 1,
                    userSelect: 'none',
                    transition: 'background 0.1s ease',
                    '&:hover': {
                      bgcolor: folderName === currentFolder ? c.accent.primary : `${c.accent.primary}0A`,
                    },
                  }}
                >
                  {emojiList[folderName][0]}
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>
      </Popover>
    </Box>
  );
};

export default EmojiPicker;
