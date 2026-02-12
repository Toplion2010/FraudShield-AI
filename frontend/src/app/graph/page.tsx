'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { ArrowLeft, Download, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Dynamic import to avoid SSR issues with force-graph
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// Types
interface GraphNode {
  id: string;
  label: string;
  risk_score: number;
  risk_level: string;
  transaction_count: number;
  total_amount_sent: number;
  total_amount_received: number;
  is_ego: boolean;
  depth: number;
}

interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  fraud_score: number;
  edge_score: number;
  transaction_type: string;
  step: number;
  is_fraud: number;
  reasons: string[];
  is_outgoing_from_ego: boolean;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    total_nodes: number;
    total_edges: number;
    high_risk_edges: number;
    medium_risk_edges: number;
    low_risk_edges: number;
    avg_edge_score: number;
    avg_node_risk: number;
    max_depth_reached: number;
    ego_node_id: string;
  };
}

// Risk colors matching the cyber theme
const RISK_COLORS = {
  CRITICAL: '#ff3366',
  HIGH: '#ff9933',
  MEDIUM: '#ffcc00',
  LOW: '#00ff88',
};

// Edge color gradient
const getEdgeColor = (score: number): string => {
  if (score > 0.8) return '#ff3366'; // Red
  if (score > 0.6) return '#ff9933'; // Orange
  if (score > 0.4) return '#ffcc00'; // Yellow
  return '#00ff88'; // Green
};

export default function GraphPage() {
  const router = useRouter();
  const graphRef = useRef<any>();

  const [clientId, setClientId] = useState('');
  const [depth, setDepth] = useState(2);
  const [minScore, setMinScore] = useState(0.0);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const buildGraph = async () => {
    if (!clientId.trim()) {
      setError('Please enter a client ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/graph/ego-tree`, {
        client_id: clientId.trim(),
        depth: depth,
        min_fraud_score: minScore,
        limit: 100,
      });

      setGraphData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to build graph. Make sure the client ID exists and model is trained.');
      console.error('Graph build error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!graphData) return;

    // Create nodes CSV
    const nodeHeaders = ['id', 'label', 'risk_score', 'risk_level', 'transaction_count', 'total_amount_sent', 'total_amount_received', 'is_ego', 'depth'];
    const nodeRows = graphData.nodes.map(n => [
      n.id, n.label, n.risk_score, n.risk_level, n.transaction_count,
      n.total_amount_sent, n.total_amount_received, n.is_ego, n.depth
    ]);
    const nodesCSV = [nodeHeaders, ...nodeRows].map(row => row.join(',')).join('\n');

    // Create edges CSV
    const edgeHeaders = ['source', 'target', 'amount', 'fraud_score', 'edge_score', 'transaction_type', 'step', 'is_fraud', 'reasons', 'is_outgoing_from_ego'];
    const edgeRows = graphData.edges.map(e => [
      e.source, e.target, e.amount, e.fraud_score, e.edge_score,
      e.transaction_type, e.step, e.is_fraud, `"${e.reasons.join('; ')}"`, e.is_outgoing_from_ego
    ]);
    const edgesCSV = [edgeHeaders, ...edgeRows].map(row => row.join(',')).join('\n');

    // Download nodes
    const nodesBlob = new Blob([nodesCSV], { type: 'text/csv' });
    const nodesUrl = URL.createObjectURL(nodesBlob);
    const nodesLink = document.createElement('a');
    nodesLink.href = nodesUrl;
    nodesLink.download = `ego_tree_nodes_${clientId}.csv`;
    nodesLink.click();

    // Download edges
    setTimeout(() => {
      const edgesBlob = new Blob([edgesCSV], { type: 'text/csv' });
      const edgesUrl = URL.createObjectURL(edgesBlob);
      const edgesLink = document.createElement('a');
      edgesLink.href = edgesUrl;
      edgesLink.download = `ego_tree_edges_${clientId}.csv`;
      edgesLink.click();
    }, 500);
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node);
  }, []);

  // Transform data for force-graph
  const graphLinks = graphData?.edges.map(e => ({
    ...e,
    source: e.source,
    target: e.target,
  })) || [];

  return (
    <div className="min-h-screen bg-cyber-dark text-white">
      {/* Header */}
      <div className="bg-cyber-card border-b border-cyber-green/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-cyber-green hover:text-cyber-green-dark transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold cyber-glow">Ego-Tree Risk Graph</h1>
                <p className="text-gray-400 text-sm">Directed relationship analysis for fraud detection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="cyber-card p-6 space-y-6">
              <h2 className="text-xl font-bold text-cyber-green">Controls</h2>

              {/* Client ID Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Client ID</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g., C1234567890"
                    className="w-full bg-cyber-darker border border-cyber-green/30 rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-green"
                    onKeyPress={(e) => e.key === 'Enter' && buildGraph()}
                  />
                  <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              {/* Depth Slider */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Depth: {depth}
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-full h-2 bg-cyber-darker rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${((depth - 1) / 2) * 100}%, #0f1419 ${((depth - 1) / 2) * 100}%, #0f1419 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>
              </div>

              {/* Min Score Slider */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Min Risk Score: {minScore.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minScore}
                  onChange={(e) => setMinScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-cyber-darker rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.0</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              {/* Build Button */}
              <button
                onClick={buildGraph}
                disabled={loading}
                className="w-full cyber-button py-3 rounded font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Building...
                  </span>
                ) : (
                  'Build Graph'
                )}
              </button>

              {/* Export Button */}
              {graphData && (
                <button
                  onClick={exportToCSV}
                  className="w-full bg-cyber-card border border-cyber-green/30 hover:border-cyber-green text-white py-3 rounded font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Export CSV
                </button>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Legend */}
              {graphData && (
                <div className="border-t border-cyber-green/30 pt-4 space-y-3">
                  <h3 className="text-sm font-bold text-cyber-green">Legend</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff3366]"></div>
                      <span>Critical Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff9933]"></div>
                      <span>High Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#ffcc00]"></div>
                      <span>Medium Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#00ff88]"></div>
                      <span>Low Risk</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              {graphData && (
                <div className="border-t border-cyber-green/30 pt-4 space-y-2 text-sm">
                  <h3 className="font-bold text-cyber-green mb-2">Summary</h3>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nodes:</span>
                    <span>{graphData.summary.total_nodes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Edges:</span>
                    <span>{graphData.summary.total_edges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">High Risk:</span>
                    <span className="text-red-400">{graphData.summary.high_risk_edges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Risk:</span>
                    <span>{graphData.summary.avg_edge_score.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Depth:</span>
                    <span>{graphData.summary.max_depth_reached}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="cyber-card p-6 mt-6 space-y-3">
                <h2 className="text-xl font-bold text-cyber-green mb-3">Node Details</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">ID:</span>
                    <p className="text-white break-all">{selectedNode.id}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span
                      className="font-bold"
                      style={{ color: RISK_COLORS[selectedNode.risk_level as keyof typeof RISK_COLORS] }}
                    >
                      {selectedNode.risk_level}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Score:</span>
                    <span>{selectedNode.risk_score.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transactions:</span>
                    <span>{selectedNode.transaction_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sent:</span>
                    <span>${selectedNode.total_amount_sent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Received:</span>
                    <span>${selectedNode.total_amount_received.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Depth:</span>
                    <span>{selectedNode.depth}</span>
                  </div>
                  {selectedNode.is_ego && (
                    <div className="bg-cyber-green/10 border border-cyber-green/30 rounded p-2 text-center">
                      <span className="text-cyber-green font-bold">EGO NODE</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Graph Visualization */}
          <div className="lg:col-span-3">
            <div className="cyber-card p-6">
              {!graphData ? (
                <div className="flex items-center justify-center h-[600px] text-gray-400">
                  <div className="text-center">
                    <Search size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Enter a client ID and click Build Graph to start</p>
                    <p className="text-sm mt-2">The graph will show all transaction relationships</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={{
                      nodes: graphData.nodes,
                      links: graphLinks
                    }}
                    nodeLabel={(node: any) => {
                      const n = node as GraphNode;
                      return `
                        <div style="background: rgba(0,0,0,0.9); padding: 8px; border-radius: 4px; border: 1px solid ${RISK_COLORS[n.risk_level as keyof typeof RISK_COLORS]};">
                          <div style="color: #00ff88; font-weight: bold;">${n.id}</div>
                          <div style="color: #fff; margin-top: 4px;">Risk: ${n.risk_score.toFixed(2)} (${n.risk_level})</div>
                          <div style="color: #aaa;">Transactions: ${n.transaction_count}</div>
                          <div style="color: #aaa;">Sent: $${n.total_amount_sent.toLocaleString()}</div>
                          <div style="color: #aaa;">Received: $${n.total_amount_received.toLocaleString()}</div>
                        </div>
                      `;
                    }}
                    nodeColor={(node: any) => {
                      const n = node as GraphNode;
                      return RISK_COLORS[n.risk_level as keyof typeof RISK_COLORS];
                    }}
                    nodeVal={(node: any) => {
                      const n = node as GraphNode;
                      return n.is_ego ? 20 : 5 + (n.risk_score * 15);
                    }}
                    linkLabel={(link: any) => {
                      const l = link as GraphEdge;
                      return `
                        <div style="background: rgba(0,0,0,0.9); padding: 8px; border-radius: 4px; border: 1px solid ${getEdgeColor(l.edge_score)};">
                          <div style="color: #00ff88; font-weight: bold;">${l.source} → ${l.target}</div>
                          <div style="color: #fff; margin-top: 4px;">Amount: $${l.amount.toLocaleString()}</div>
                          <div style="color: #fff;">Risk Score: ${l.edge_score.toFixed(2)}</div>
                          <div style="color: #fff;">Type: ${l.transaction_type}</div>
                          <div style="color: #fff;">Step: ${l.step}</div>
                          ${l.is_fraud ? '<div style="color: #ff3366; font-weight: bold;">⚠ CONFIRMED FRAUD</div>' : ''}
                          <div style="color: #aaa; margin-top: 4px; font-size: 11px;">${l.reasons.join(', ')}</div>
                        </div>
                      `;
                    }}
                    linkColor={(link: any) => {
                      const l = link as GraphEdge;
                      return getEdgeColor(l.edge_score);
                    }}
                    linkWidth={(link: any) => {
                      const l = link as GraphEdge;
                      return l.is_outgoing_from_ego ? 2 + (l.edge_score * 3) : 1 + (l.edge_score * 2);
                    }}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    linkCurvature={0.2}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    width={800}
                    height={600}
                    backgroundColor="#0a0e14"
                    nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                      const n = node as GraphNode;
                      const label = n.label;
                      const fontSize = 12 / globalScale;
                      ctx.font = `${fontSize}px Sans-Serif`;

                      // Draw node circle
                      const size = n.is_ego ? 10 : 3 + (n.risk_score * 5);
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                      ctx.fillStyle = RISK_COLORS[n.risk_level as keyof typeof RISK_COLORS];
                      ctx.fill();

                      // Draw border for ego node
                      if (n.is_ego) {
                        ctx.lineWidth = 2 / globalScale;
                        ctx.strokeStyle = '#ffffff';
                        ctx.stroke();
                      }

                      // Draw label
                      ctx.textAlign = 'center';
                      ctx.textBaseline = 'middle';
                      ctx.fillStyle = '#ffffff';
                      ctx.fillText(label, node.x, node.y + size + fontSize);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
