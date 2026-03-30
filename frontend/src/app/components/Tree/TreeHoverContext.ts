import { createContext } from 'react';

export const TreeHoverContext = createContext<{
  hoveredNodeId: string | null;
  onNodeHover: (nodeId: string | null) => void;
}>({
  hoveredNodeId: null,
  onNodeHover: () => {},
});
