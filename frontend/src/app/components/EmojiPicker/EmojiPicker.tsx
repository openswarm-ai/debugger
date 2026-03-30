import React, { useState, useEffect, useRef } from 'react';
import { emojiList } from '@/shared/constants/emojis';
import './EmojiPicker.css';

const EMOJIS_PER_PAGE = 30;

const ChevronLeft: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

interface EmojiPickerProps {
  defaultEmoji: string;
  handleEmojiChange: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ defaultEmoji, handleEmojiChange }) => {
  const folderNames = Object.keys(emojiList);
  const firstFolder = folderNames[0];
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(defaultEmoji || '⚫');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentFolder, setCurrentFolder] = useState(firstFolder);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultEmoji) {
      setSelectedEmoji(defaultEmoji);
    }
  }, [defaultEmoji]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

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
    setShowPicker(false);
    handleEmojiChange(emoji);
  };

  const togglePicker = () => setShowPicker((prev) => !prev);

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
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      goToNextFolder();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      goToPreviousFolder();
    }
  };

  const isLastFolder = currentFolder === folderNames[folderNames.length - 1];
  const isLastPageOfLastFolder = isLastFolder && currentPage === totalPages - 1;
  const isFirstFolder = currentFolder === folderNames[0];
  const isFirstPageOfFirstFolder = isFirstFolder && currentPage === 0;

  return (
    <div className="picker-wrapper" ref={pickerRef}>
      <button onClick={togglePicker} className="picker-button">
        {selectedEmoji}
      </button>

      {showPicker && (
        <div className="emoji-popup">
          <div className="emoji-grid-section">
            <button className="page-btn" onClick={goToPreviousPage} disabled={isFirstPageOfFirstFolder}>
              <ChevronLeft />
            </button>
            <div className="emoji-grid">
              {currentEmojis.map((emoji, index) => (
                <span
                  key={index}
                  className="emoji-item"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>
            <button className="page-btn" onClick={goToNextPage} disabled={isLastPageOfLastFolder}>
              <ChevronRight />
            </button>
          </div>

          <div className="folder-tabs">
            {folderNames.map((folderName, index) => (
              <div
                key={index}
                className={`folder-tab ${folderName === currentFolder ? 'active' : ''}`}
                onClick={() => handleFolderClick(folderName)}
              >
                {emojiList[folderName][0]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
