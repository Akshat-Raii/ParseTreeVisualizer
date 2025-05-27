import React, { useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface ASTNode {
  type: string;
  value?: string;
  children: ASTNode[];
}

interface ParseTreeProps {
  ast: ASTNode;
}

interface FlattenedNode {
  id: string;
  parentId: string | null;
  label: string;
  astNode: ASTNode;
  depth: number;
  xOffset: number;
}

let idCounter = 0;
function getId() {
  return `node-${idCounter++}`;
}

function flattenASTForLookup(
  node: ASTNode,
  parentId: string | null = null,
  depth = 0,
  xOffset = 0,
  result: Map<string, FlattenedNode> = new Map()
): { map: Map<string, FlattenedNode>; id: string } {
  const id = getId();
  const label = node.value ? `${node.type}: ${node.value}` : node.type;

  result.set(id, {
    id,
    parentId,
    label,
    astNode: node,
    depth,
    xOffset,
  });

  let nextX = xOffset;
  for (const child of node.children) {
    const { id: childId } = flattenASTForLookup(
      child,
      id,
      depth + 1,
      nextX,
      result
    );
    nextX++;
  }

  return { map: result, id };
}

function generateVisibleGraph(
  expanded: Set<string>,
  nodeMap: Map<string, FlattenedNode>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const nodeId of nodeMap.keys()) {
    if (!isVisible(nodeId, nodeMap, expanded)) continue;

    const { id, label, depth, xOffset, parentId } = nodeMap.get(nodeId)!;

    nodes.push({
      id,
      data: { label },
      position: { x: xOffset * 200, y: depth * 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      type: 'default',
    });

    if (parentId && isVisible(parentId, nodeMap, expanded)) {
      edges.push({
        id: `${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
      });
    }
  }

  return { nodes, edges };
}

function isVisible(
  nodeId: string,
  nodeMap: Map<string, FlattenedNode>,
  expanded: Set<string>
): boolean {
  let current = nodeMap.get(nodeId);
  while (current) {
    if (current.parentId && !expanded.has(current.parentId)) return false;
    current = current.parentId ? nodeMap.get(current.parentId) : null;
  }
  return true;
}

const ParseTree: React.FC<ParseTreeProps> = ({ ast }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const { nodeMap, rootId } = useMemo(() => {
    idCounter = 0;
    const { map, id } = flattenASTForLookup(ast);
    return { nodeMap: map, rootId: id };
  }, [ast]);

  useMemo(() => {
    // Initially show only the root node
    setExpandedNodes(new Set([rootId]));
  }, [rootId]);

  const { nodes, edges } = useMemo(() => {
    return generateVisibleGraph(expandedNodes, nodeMap);
  }, [expandedNodes, nodeMap]);

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const children = Array.from(nodeMap.values()).filter(
        (n) => n.parentId === node.id
      );
      if (children.length > 0) {
        const newSet = new Set(expandedNodes);
        newSet.add(node.id);
        setExpandedNodes(newSet);
      }
    },
    [expandedNodes, nodeMap]
  );

  return (
    <div className="w-full h-full" style={{ height: '600px' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ParseTree;
