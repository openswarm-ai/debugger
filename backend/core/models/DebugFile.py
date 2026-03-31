import os
from backend.core.models.File import File
from backend.core.DEFAULTS import DEFAULT_COLOR, DEFAULT_TOGGLED, DEFAULT_SET_MANUALLY, DEFAULT_SET_MANUALLY_EMOJI, DEFAULT_EMOJI

class DebugFile(File):
    def __init__(self, filename, path, color=DEFAULT_COLOR, is_toggled=DEFAULT_TOGGLED, 
                 set_manually=DEFAULT_SET_MANUALLY, set_manually_emoji=DEFAULT_SET_MANUALLY_EMOJI,
                 emoji=DEFAULT_EMOJI, directory=None):
        super().__init__(filename, path)
        self.color = color
        self.is_toggled = is_toggled
        self.set_manually = set_manually
        self.set_manually_emoji = set_manually_emoji
        self.emoji = emoji
        self.directory = directory  # Reference to parent directory

    def to_dict(self):
        """
        Converts the DebugFile object to a dictionary format.
        """
        return {
            "name": os.path.basename(self.filename),
            "color": self.color,
            "is_toggled": self.is_toggled,
            "set_manually": self.set_manually,
            "set_manually_emoji": self.set_manually_emoji,
            "emoji": self.emoji
        }
