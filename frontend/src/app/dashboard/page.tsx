'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileText, AlertCircle, TrendingUp, Shield, Activity, Network, Loader2, Download, X, User, MapPin, Briefcase, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamic import for force-graph
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const RISK_COLORS = {
  CRITICAL: '#ff3366',
  HIGH: '#ff9933',
  MEDIUM: '#ffcc00',
  LOW: '#00ff88',
};

// Types for graph
interface PersonDetails {
  name: string;
  account_type: string;
  location?: string;
  age?: number;
  occupation?: string;
  photo_url?: string;
  registration_date?: string;
  email?: string;
  phone?: string;
  kyc_verified: boolean;
}

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
  person_details?: PersonDetails;
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

const getEdgeColor = (score: number): string => {
  if (score > 0.8) return '#ff3366';
  if (score > 0.6) return '#ff9933';
  if (score > 0.4) return '#ffcc00';
  return '#00ff88';
};

export default function DashboardPage() {
  const graphRef = useRef<any>();

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Graph state
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [graphDepth, setGraphDepth] = useState(2);
  const [graphMinScore, setGraphMinScore] = useState(0.0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showPersonModal, setShowPersonModal] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedData = localStorage.getItem('fraudAnalysisData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setAnalysisData(parsedData);
      } catch (err) {
        console.error('Failed to parse stored data:', err);
      }
    }
  }, []);

  const hasData = analysisData !== null;

  const filteredTransactions = hasData
    ? analysisData.transactions.filter((tx: any) =>
        filterRisk === 'ALL' || tx.risk_level === filterRisk
      )
    : [];

  // Prepare chart data
  const riskDistributionData = hasData && analysisData.distributions?.risk_levels
    ? Object.entries(analysisData.distributions.risk_levels).map(([name, value]) => ({
        name,
        value: value as number,
        color: RISK_COLORS[name as keyof typeof RISK_COLORS] || '#888888',
      }))
    : [];

  const typeDistributionData = hasData && analysisData.distributions?.transaction_types
    ? Object.entries(analysisData.distributions.transaction_types).map(([name, value]) => ({
        name,
        count: value as number,
      }))
    : [];

  // Build graph for selected client
  const buildGraph = async (clientId: string) => {
    if (!clientId.trim()) {
      setGraphError('Please enter a client ID');
      return;
    }

    setGraphLoading(true);
    setGraphError(null);
    setSelectedNode(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/graph/ego-tree`, {
        client_id: clientId.trim(),
        depth: graphDepth,
        min_fraud_score: graphMinScore,
        limit: 100,
      });

      setGraphData(response.data);
      setShowGraph(true);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || 'Failed to build graph';

      // Provide helpful error messages
      if (errorDetail.includes('not found')) {
        setGraphError(`Client ID "${clientId.trim()}" not found in the dataset. Please check the ID or try another one from the transaction table below.`);
      } else if (errorDetail.includes('not trained') || errorDetail.includes('No training data')) {
        setGraphError('Model not trained yet. Please go to the Upload page and train the model first with your CSV file.');
      } else {
        setGraphError(errorDetail);
      }

      console.error('Graph build error:', err);
    } finally {
      setGraphLoading(false);
    }
  };

  // Quick build from transaction table
  const quickBuildGraph = (clientId: string) => {
    setSelectedClientId(clientId);
    buildGraph(clientId);
  };

  // Export graph to CSV
  const exportGraphCSV = () => {
    if (!graphData) return;

    const nodeHeaders = ['id', 'label', 'risk_score', 'risk_level', 'transaction_count', 'total_amount_sent', 'total_amount_received', 'is_ego', 'depth'];
    const nodeRows = graphData.nodes.map((n: GraphNode) => [
      n.id, n.label, n.risk_score, n.risk_level, n.transaction_count,
      n.total_amount_sent, n.total_amount_received, n.is_ego, n.depth
    ]);
    const nodesCSV = [nodeHeaders, ...nodeRows].map(row => row.join(',')).join('\n');

    const edgeHeaders = ['source', 'target', 'amount', 'fraud_score', 'edge_score', 'transaction_type', 'step', 'is_fraud', 'reasons', 'is_outgoing_from_ego'];
    const edgeRows = graphData.edges.map((e: GraphEdge) => [
      e.source, e.target, e.amount, e.fraud_score, e.edge_score,
      e.transaction_type, e.step, e.is_fraud, `"${e.reasons.join('; ')}"`, e.is_outgoing_from_ego
    ]);
    const edgesCSV = [edgeHeaders, ...edgeRows].map(row => row.join(',')).join('\n');

    const nodesBlob = new Blob([nodesCSV], { type: 'text/csv' });
    const nodesUrl = URL.createObjectURL(nodesBlob);
    const nodesLink = document.createElement('a');
    nodesLink.href = nodesUrl;
    nodesLink.download = `ego_tree_nodes_${selectedClientId}.csv`;
    nodesLink.click();

    setTimeout(() => {
      const edgesBlob = new Blob([edgesCSV], { type: 'text/csv' });
      const edgesUrl = URL.createObjectURL(edgesBlob);
      const edgesLink = document.createElement('a');
      edgesLink.href = edgesUrl;
      edgesLink.download = `ego_tree_edges_${selectedClientId}.csv`;
      edgesLink.click();
    }, 500);
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setShowPersonModal(true);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const graphLinks = graphData?.edges.map((e: GraphEdge) => ({
    ...e,
    source: e.source,
    target: e.target,
  })) || [];

  // Person Details Modal Component
  const PersonDetailsModal = () => {
    if (!showPersonModal || !selectedNode?.person_details) return null;

    const details = selectedNode.person_details;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowPersonModal(false)}>
        <div className="bg-cyber-card border-2 border-cyber-green rounded-xl max-w-2xl w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cyber-green/30">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-cyber-green" />
              <h2 className="text-2xl font-bold text-white">Account Details</h2>
            </div>
            <button onClick={() => setShowPersonModal(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: Photo and Name */}
              <div className="col-span-1">
                <div className="relative">
                  {details.photo_url ? (
                    <img
                      src={details.photo_url}
                      alt={details.name}
                      className="w-full aspect-square object-cover rounded-lg border-2 border-cyber-green/30"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(details.name)}&size=300&background=00ff88&color=0a0e14`;
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-cyber-darker rounded-lg border-2 border-cyber-green/30 flex items-center justify-center">
                      <User className="w-24 h-24 text-cyber-green/30" />
                    </div>
                  )}
                  {details.kyc_verified && (
                    <div className="absolute top-2 right-2 bg-cyber-green text-black rounded-full p-1">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-bold text-white">{details.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{details.account_type}</p>
                </div>
              </div>

              {/* Right: Details */}
              <div className="col-span-2 space-y-4">
                {/* Account ID */}
                <div className="bg-cyber-darker rounded-lg p-4 border border-cyber-green/20">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <Shield size={16} />
                    <span>Account ID</span>
                  </div>
                  <p className="text-white font-mono text-sm break-all">{selectedNode.id}</p>
                </div>

                {/* Risk Level */}
                <div className="bg-cyber-darker rounded-lg p-4 border border-cyber-green/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <AlertCircle size={16} />
                      <span>Risk Level</span>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${RISK_COLORS[selectedNode.risk_level as keyof typeof RISK_COLORS]}20`,
                        color: RISK_COLORS[selectedNode.risk_level as keyof typeof RISK_COLORS]
                      }}
                    >
                      {selectedNode.risk_level}
                    </span>
                  </div>
                  <p className="text-white font-semibold">{(selectedNode.risk_score * 100).toFixed(1)}%</p>
                </div>

                {/* Location */}
                {details.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="text-white">{details.location}</p>
                    </div>
                  </div>
                )}

                {/* Age */}
                {details.age && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Age</p>
                      <p className="text-white">{details.age} years old</p>
                    </div>
                  </div>
                )}

                {/* Occupation */}
                {details.occupation && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Occupation</p>
                      <p className="text-white">{details.occupation}</p>
                    </div>
                  </div>
                )}

                {/* Email */}
                {details.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white text-sm break-all">{details.email}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {details.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{details.phone}</p>
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                {details.registration_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-white">{new Date(details.registration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-cyber-green/20">
              <div className="bg-cyber-darker rounded-lg p-4 text-center border border-cyber-green/20">
                <p className="text-sm text-gray-400 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-cyber-green">{selectedNode.transaction_count}</p>
              </div>
              <div className="bg-cyber-darker rounded-lg p-4 text-center border border-cyber-green/20">
                <p className="text-sm text-gray-400 mb-1">Total Sent</p>
                <p className="text-xl font-bold text-white">${selectedNode.total_amount_sent.toLocaleString()}</p>
              </div>
              <div className="bg-cyber-darker rounded-lg p-4 text-center border border-cyber-green/20">
                <p className="text-sm text-gray-400 mb-1">Total Received</p>
                <p className="text-xl font-bold text-white">${selectedNode.total_amount_received.toLocaleString()}</p>
              </div>
            </div>

            {/* KYC Status */}
            <div className={`mt-4 p-4 rounded-lg border ${details.kyc_verified ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                {details.kyc_verified ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold">KYC Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">KYC Not Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Person Details Modal */}
      <PersonDetailsModal />

      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyber-green/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-cyber-green" />
                <h1 className="text-xl font-bold text-cyber-green">FraudShield AI</h1>
              </Link>
              <nav className="flex space-x-6">
                <Link href="/" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Home
                </Link>
                <Link href="/upload" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Upload
                </Link>
                <Link href="/dashboard" className="text-cyber-green font-semibold">
                  Dashboard
                </Link>
                <Link href="/graph" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Graph
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-cyber-green">Analytics Dashboard</h1>
            <p className="text-gray-400">
              Real-time fraud detection analytics and insights
            </p>
          </div>

          {!hasData ? (
            <div className="cyber-card p-12 rounded-xl text-center">
              <Activity className="w-16 h-16 text-cyber-green mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-white mb-4">No Data Available</h2>
              <p className="text-gray-400 mb-8">
                Upload and analyze transaction data to view the dashboard
              </p>
              <Link href="/upload">
                <button className="cyber-button">
                  Go to Upload Page
                </button>
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="cyber-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold text-white">
                    {analysisData.summary.total_transactions.toLocaleString()}
                  </p>
                </div>

                <div className="cyber-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <AlertCircle className="w-8 h-8 text-cyber-red" />
                  </div>
                  <p className="text-sm text-gray-400 mb-1">Suspicious</p>
                  <p className="text-3xl font-bold text-cyber-red">
                    {analysisData.summary.suspicious_count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analysisData.summary.suspicious_percentage.toFixed(2)}% of total
                  </p>
                </div>

                <div className="cyber-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-8 h-8 text-cyber-orange" />
                  </div>
                  <p className="text-sm text-gray-400 mb-1">High Risk</p>
                  <p className="text-3xl font-bold text-cyber-orange">
                    {analysisData.summary.high_risk_count.toLocaleString()}
                  </p>
                </div>

                <div className="cyber-card p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="w-8 h-8 text-cyber-green" />
                  </div>
                  <p className="text-sm text-gray-400 mb-1">Avg Fraud Score</p>
                  <p className="text-3xl font-bold text-cyber-green">
                    {(analysisData.summary.average_fraud_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Risk Level Distribution */}
                <div className="cyber-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Risk Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0e14',
                          border: '1px solid #00ff88',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Transaction Type Distribution */}
                <div className="cyber-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold text-white mb-4">Transaction Types</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0e14',
                          border: '1px solid #00ff88',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#00ff88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ego-Tree Risk Graph Section */}
              <div className="cyber-card p-6 rounded-xl mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Network className="w-6 h-6 text-cyber-green" />
                    <h3 className="text-xl font-bold text-white">Relationship Graph Explorer</h3>
                  </div>
                  {showGraph && graphData && (
                    <button
                      onClick={() => setShowGraph(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  )}
                </div>

                {!showGraph ? (
                  <div className="text-center py-8">
                    <Network className="w-16 h-16 text-cyber-green/50 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">
                      Visualize transaction networks by entering a client ID or clicking on an account from the table below
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      Note: Make sure you've trained the model first on the <Link href="/upload" className="text-cyber-green hover:underline">upload page</Link>
                    </p>

                    <div className="max-w-2xl mx-auto space-y-4">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          placeholder="Enter Client ID (e.g., C1021138110)"
                          className="flex-1 bg-cyber-darker border border-cyber-green/30 rounded px-4 py-2 text-white focus:outline-none focus:border-cyber-green"
                          onKeyPress={(e) => e.key === 'Enter' && buildGraph(selectedClientId)}
                        />
                        <button
                          onClick={() => buildGraph(selectedClientId)}
                          disabled={graphLoading}
                          className="cyber-button px-6 py-2 rounded disabled:opacity-50"
                        >
                          {graphLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="animate-spin" size={18} />
                              Building...
                            </span>
                          ) : (
                            'Build Graph'
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Depth: {graphDepth}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            value={graphDepth}
                            onChange={(e) => setGraphDepth(parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Min Risk: {graphMinScore.toFixed(1)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={graphMinScore}
                            onChange={(e) => setGraphMinScore(parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.0</span>
                            <span>0.5</span>
                            <span>1.0</span>
                          </div>
                        </div>
                      </div>

                      {graphError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
                          {graphError}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-400">Client: </span>
                          <span className="text-white font-semibold">{selectedClientId}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-400">Nodes: <span className="text-white">{graphData.summary.total_nodes}</span></span>
                          <span className="text-gray-400">Edges: <span className="text-white">{graphData.summary.total_edges}</span></span>
                          <span className="text-gray-400">High Risk: <span className="text-red-400">{graphData.summary.high_risk_edges}</span></span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={exportGraphCSV}
                          className="bg-cyber-card border border-cyber-green/30 hover:border-cyber-green text-white px-4 py-2 rounded text-sm flex items-center gap-2 transition-all"
                        >
                          <Download size={16} />
                          Export CSV
                        </button>
                        <button
                          onClick={() => setShowGraph(false)}
                          className="bg-cyber-card border border-gray-600 hover:border-gray-400 text-white px-4 py-2 rounded text-sm transition-all"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3 bg-cyber-darker rounded-lg overflow-hidden">
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
                          nodeColor={(node: any) => RISK_COLORS[(node as GraphNode).risk_level as keyof typeof RISK_COLORS]}
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
                                <div style="color: #fff;">Risk: ${l.edge_score.toFixed(2)}</div>
                                <div style="color: #fff;">Type: ${l.transaction_type}</div>
                                ${l.is_fraud ? '<div style="color: #ff3366; font-weight: bold;">⚠ FRAUD</div>' : ''}
                                <div style="color: #aaa; margin-top: 4px; font-size: 11px;">${l.reasons.join(', ')}</div>
                              </div>
                            `;
                          }}
                          linkColor={(link: any) => getEdgeColor((link as GraphEdge).edge_score)}
                          linkWidth={(link: any) => {
                            const l = link as GraphEdge;
                            return l.is_outgoing_from_ego ? 2 + (l.edge_score * 3) : 1 + (l.edge_score * 2);
                          }}
                          linkDirectionalArrowLength={4}
                          linkDirectionalArrowRelPos={1}
                          linkCurvature={0.2}
                          onNodeClick={handleNodeClick}
                          width={900}
                          height={500}
                          backgroundColor="#0a0e14"
                          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                            const n = node as GraphNode;
                            const label = n.label;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;

                            const size = n.is_ego ? 10 : 3 + (n.risk_score * 5);
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                            ctx.fillStyle = RISK_COLORS[n.risk_level as keyof typeof RISK_COLORS];
                            ctx.fill();

                            if (n.is_ego) {
                              ctx.lineWidth = 2 / globalScale;
                              ctx.strokeStyle = '#ffffff';
                              ctx.stroke();
                            }

                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(label, node.x, node.y + size + fontSize);
                          }}
                        />
                      </div>

                      <div className="col-span-1 space-y-4">
                        {selectedNode ? (
                          <div className="bg-cyber-card border border-cyber-green/30 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-cyber-green mb-3">Node Details</h4>
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="text-gray-400">ID:</span>
                                <p className="text-white break-all">{selectedNode.id}</p>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Risk:</span>
                                <span
                                  className="font-bold"
                                  style={{ color: RISK_COLORS[selectedNode.risk_level as keyof typeof RISK_COLORS] }}
                                >
                                  {selectedNode.risk_level}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Score:</span>
                                <span>{selectedNode.risk_score.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">TXs:</span>
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
                              {selectedNode.is_ego && (
                                <div className="bg-cyber-green/10 border border-cyber-green/30 rounded p-2 text-center mt-2">
                                  <span className="text-cyber-green font-bold text-xs">EGO NODE</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-cyber-card border border-gray-700 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-400">Click a node to view details</p>
                          </div>
                        )}

                        <div className="bg-cyber-card border border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-gray-300 mb-3">Legend</h4>
                          <div className="space-y-2 text-xs">
                            {Object.entries(RISK_COLORS).map(([level, color]) => (
                              <div key={level} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                <span className="text-gray-400">{level}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-cyber-card border border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-bold text-gray-300 mb-2">Stats</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Avg Risk:</span>
                              <span>{graphData.summary.avg_edge_score.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Depth:</span>
                              <span>{graphData.summary.max_depth_reached}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">High Risk:</span>
                              <span className="text-red-400">{graphData.summary.high_risk_edges}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Medium:</span>
                              <span className="text-orange-400">{graphData.summary.medium_risk_edges}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Low:</span>
                              <span className="text-green-400">{graphData.summary.low_risk_edges}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Table */}
              <div className="cyber-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
                  <div className="flex space-x-2">
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
                      <button
                        key={risk}
                        onClick={() => setFilterRisk(risk)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          filterRisk === risk
                            ? 'bg-cyber-green text-black font-semibold'
                            : 'bg-cyber-card text-gray-400 hover:text-white'
                        }`}
                      >
                        {risk}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">ID</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Origin</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Dest</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-semibold">Amount</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Score</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-semibold">Risk</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, 50).map((tx: any) => (
                        <tr
                          key={tx.transaction_id}
                          className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-300">{tx.transaction_id}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => quickBuildGraph(tx.nameOrig)}
                              className="text-cyber-green hover:text-cyber-green-dark hover:underline transition-colors text-sm"
                              title="Build graph for this account"
                            >
                              {tx.nameOrig}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => quickBuildGraph(tx.nameDest)}
                              className="text-cyber-blue hover:text-blue-300 hover:underline transition-colors text-sm"
                              title="Build graph for this account"
                            >
                              {tx.nameDest}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-white">{tx.type}</td>
                          <td className="py-3 px-4 text-right text-white">
                            ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-white font-semibold">
                              {(tx.fraud_score * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${RISK_COLORS[tx.risk_level as keyof typeof RISK_COLORS]}20`,
                                color: RISK_COLORS[tx.risk_level as keyof typeof RISK_COLORS]
                              }}
                            >
                              {tx.risk_level}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {tx.is_suspicious ? (
                              <span className="text-cyber-red text-sm">⚠️ Suspicious</span>
                            ) : (
                              <span className="text-cyber-green text-sm">✓ Normal</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredTransactions.length > 50 && (
                    <p className="text-gray-500 text-sm mt-4 text-center">
                      Showing 50 of {filteredTransactions.length} transactions
                    </p>
                  )}

                  {filteredTransactions.length === 0 && filterRisk !== 'ALL' && (
                    <p className="text-gray-500 text-center py-8">
                      No {filterRisk} risk transactions found
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
