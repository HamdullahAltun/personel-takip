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
                        <div className="flex flex-col items-center p-3 bg-white rounded-xl shadow-lg border border-slate-100 w-[180px] hover:scale-105 transition-transform">
                            <div className="relative mb-2">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        {u.profilePicture ? (
                                            <img src={u.profilePicture} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-black text-slate-700">{u.name.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                                {u.role === 'ADMIN' && (
                                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-sm">LIDER</span>
                                )}
                            </div>
                            <div className="text-center w-full">
                                <p className="text-[11px] font-black text-slate-800 truncate leading-tight mb-0.5">{u.name}</p>
                                <p className="text-[9px] font-medium text-slate-400 truncate uppercase tracking-wide">{u.role}</p>
                                {u.department && (
                                    <span className="mt-1.5 inline-block text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                        {u.department.name}
                                    </span>
                                )}
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
