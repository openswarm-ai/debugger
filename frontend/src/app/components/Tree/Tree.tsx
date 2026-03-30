import React from 'react';
import TreeNode from '@/app/components/Tree/TreeNode';
import { TreeNodeData, ExpandedState } from '@/types';
import './Tree.css';

interface TreeProps {
  projectStructure: TreeNodeData[];
  expanded: ExpandedState;
  handleExpandClick: (id: string) => void;
  handleCheckboxChange: (nodeId: string, checked: boolean) => void;
  handleColorChange: (nodeId: string, color: string) => void;
  handleEmojiChange: (nodeId: string, emoji: string) => void;
}

const Tree: React.FC<TreeProps> = ({
  projectStructure,
  expanded,
  handleExpandClick,
  handleCheckboxChange,
  handleColorChange,
  handleEmojiChange,
}) => {
  const renderTree = (node: TreeNodeData, parentId = '') => {
    const nodeId = parentId ? `${parentId}/${node.name}` : node.name;
    return (
      <TreeNode
        key={nodeId}
        node={node}
        nodeId={nodeId}
        expanded={expanded}
        handleExpandClick={handleExpandClick}
        handleCheckboxChange={handleCheckboxChange}
        handleColorChange={handleColorChange}
        handleEmojiChange={handleEmojiChange}
        renderTree={renderTree}
      />
    );
  };

  if (!Array.isArray(projectStructure)) return null;

  return (
    <div className="tree-container">
      {projectStructure.map((node) => renderTree(node))}
    </div>
  );
};

export default Tree;
