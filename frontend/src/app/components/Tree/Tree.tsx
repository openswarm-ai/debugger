import React from 'react';
import Box from '@mui/material/Box';
import { useClaudeTokens } from '@/shared/styles/ThemeContext';
import { useAppSelector } from '@/shared/hooks';
import { TreeNodeData } from '@/types';
import TreeNode from '@/app/components/Tree/TreeNode';

const Tree: React.FC = () => {
  const c = useClaudeTokens();
  const projectStructure = useAppSelector((s) => s.debugger.projectStructure);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {projectStructure.map((node, index) => renderTree(node, '', index))}
    </Box>
  );
};

export default Tree;
