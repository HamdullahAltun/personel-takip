"use client";

import { useState, useEffect, useCallback } from "react";
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
    ConnectionLineType,
    MarkerType,
    Node,
    Edge,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { User } from "lucide-react";

// Custom Node Component could be defined here or imported
// For simplicity we use default nodes but styled

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'TB' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Top;
        node.sourcePosition = Position.Bottom;
        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

export default function OrganizationChart() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then((users: any[]) => {
            if (!Array.isArray(users)) return;

            // Transform users to nodes/edges
            const newNodes: Node[] = users.map(u => ({
                id: u.id,
                data: {
                    label: (
                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200 w-[160px]">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                                {u.profilePicture ? (
                                    <img src={u.profilePicture} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[10px] font-bold text-indigo-600">{u.name.substring(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold truncate">{u.name}</p>
                                <p className="text-[8px] text-slate-500 truncate">{u.role}</p>
                            </div>
                        </div>
                    )
                },
                position: { x: 0, y: 0 }, // Calculated by dagre
                style: { backgroundColor: 'transparent', border: 'none', padding: 0 }
            }));

            const newEdges: Edge[] = [];
            users.forEach(u => {
                if (u.managerId) {
                    newEdges.push({
                        id: `e${u.managerId}-${u.id}`,
                        source: u.managerId,
                        target: u.id,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed },
                        animated: true,
                        style: { stroke: '#94a3b8' }
                    });
                }
            });

            const layouted = getLayoutedElements(newNodes, newEdges);
            setNodes(layouted.nodes);
            setEdges(layouted.edges);
            setInitialLoading(false);
        });
    }, [setNodes, setEdges]);

    if (initialLoading) return <div className="h-full flex items-center justify-center text-slate-400">Yükleniyor...</div>;

    return (
        <div className="h-[calc(100vh-120px)] w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                className="bg-slate-50"
            >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
            </ReactFlow>
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur p-2 rounded-lg text-xs text-slate-500 border border-slate-200">
                Fare tekerleği ile yakınlaştırın, sürükleyerek gezinin.
            </div>
        </div>
    );
}
