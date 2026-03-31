import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { useAppSelector } from '@/shared/hooks';
import { TreeNodeData } from '@/types';
import TreeNode from '@/app/components/Tree/TreeNode';
import { TreeHoverContext } from '@/app/components/Tree/TreeHoverContext';

const Tree: React.FC = () => {
  const projectStructure = useAppSelector((s) => s.debugger.projectStructure);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const clearHover = useCallback(() => setHoveredNodeId(null), []);

  const renderTree = (node: TreeNodeData, parentId = '', index = 0, depth = 0) => {
    const nodeId = parentId ? `${parentId}/${node.name}` : node.name;
    return (
      <TreeNode
        key={nodeId}
        node={node}
        nodeId={nodeId}
        renderTree={renderTree}
        index={index}
        depth={depth}
      />
    );
  };

  if (!Array.isArray(projectStructure)) return null;

  return (
    <TreeHoverContext.Provider value={{ hoveredNodeId, onNodeHover: setHoveredNodeId }}>
      <Box
        onMouseLeave={clearHover}
        onMouseOver={clearHover}
        sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
      >
        {projectStructure.map((node, index) => renderTree(node, '', index))}
      </Box>
    </TreeHoverContext.Provider>
  );
};

export default Tree;
