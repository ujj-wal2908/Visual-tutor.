import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';

// Wrap the main component export in ReactFlowProvider
function MindMapViewerInternal({ nodes: propNodes, edges: propEdges, isLoading, onNodeClick }) { // Receive onNodeClick prop
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges);
  const nodesExist = nodes && nodes.length > 0;

  useEffect(() => {
    setNodes(propNodes);
    setEdges(propEdges);
  }, [propNodes, propEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--color-teal-accent)' } }, eds)),
    [setEdges],
  );

  // Handler for node click events within React Flow
  const handleNodeClick = useCallback((event, node) => {
    // Call the handler passed down from App.jsx, providing the node's label
    if (onNodeClick && node?.data?.label) {
        console.log('Node clicked:', node.data.label)
      onNodeClick(node.data.label);
    }
  }, [onNodeClick]);

  return (
    <div style={{
        height: '400px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        background: 'rgba(var(--color-dark-brown-rgb, 78, 52, 46), 0.05)'
    }}>
      {isLoading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            Loading Mind Map...
          </div>
      )}
       { nodesExist && (
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick} // Add the node click handler here
                fitView
                attributionPosition="bottom-left"
                style={{ opacity: isLoading ? 0.5 : 1 }}
            >
                <Background color="rgba(var(--color-dark-brown-rgb, 78, 52, 46), 0.1)" gap={16} />
                <Controls />
            </ReactFlow>
       )}
       { !isLoading && !nodesExist && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'var(--playful-text, var(--focused-text))', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                Enter a topic and click Generate Magic! <br/> to see the mind map.
            </div>
       ) }
    </div>
  );
}

const MindMapViewer = (props) => (
    <ReactFlowProvider>
        <MindMapViewerInternal {...props} />
    </ReactFlowProvider>
);

export default MindMapViewer;

// Helper to add RGB version of a color (Ensure runs safely client-side)
if (typeof window !== 'undefined') {
    const root = document.documentElement;
    const darkBrown = getComputedStyle(root).getPropertyValue('--color-dark-brown').trim();
    if (darkBrown && darkBrown.startsWith('#')) {
        try {
            const r = parseInt(darkBrown.slice(1, 3), 16);
            const g = parseInt(darkBrown.slice(3, 5), 16);
            const b = parseInt(darkBrown.slice(5, 7), 16);
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                root.style.setProperty('--color-dark-brown-rgb', `${r}, ${g}, ${b}`);
            }
        } catch (e) {
            console.error("Failed to parse dark brown color for RGB conversion:", e);
        }
    }
}