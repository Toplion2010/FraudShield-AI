'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [training, setTraining] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [trained, setTrained] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleTrain = async () => {
    if (!file) return;

    setTraining(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/api/train`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTrained(true);
      alert('Model trained successfully! You can now detect fraud.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Training failed. Please try again.');
    } finally {
      setTraining(false);
    }
  };

  const handleDetect = async () => {
    if (!file) return;

    setDetecting(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/api/detect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Detection failed. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-darker">
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyber-green/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-cyber-green" />
                <h1 className="text-xl font-bold text-cyber-green">FraudShield AI</h1>
              </Link>
              <nav className="flex space-x-6">
                <Link href="/" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Home
                </Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4 text-cyber-green">Upload & Detect</h1>
            <p className="text-gray-400 mb-8">
              Upload your transaction CSV file to train the model or detect fraud
            </p>

            {/* File Upload Area */}
            <div
              className={`cyber-card p-12 rounded-xl text-center mb-8 transition-all cursor-pointer ${
                dragActive ? 'border-cyber-green shadow-glow-green' : ''
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <Upload className="w-16 h-16 text-cyber-green mx-auto mb-4" />

              {file ? (
                <div>
                  <p className="text-lg text-white mb-2">Selected File:</p>
                  <p className="text-cyber-green font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-300 mb-2">
                    Drag & drop your CSV file here
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                className="cyber-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                onClick={handleTrain}
                disabled={!file || training}
              >
                {training ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Training...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Train Model</span>
                  </>
                )}
              </button>

              <button
                className="bg-cyber-card border-2 border-cyber-green text-cyber-green px-8 py-3 rounded-lg hover:bg-cyber-green/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                onClick={handleDetect}
                disabled={!file || detecting}
              >
                {detecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Detecting...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span>Detect Fraud</span>
                  </>
                )}
              </button>
            </div>

            {/* Training Status */}
            {trained && (
              <div className="bg-cyber-green/10 border border-cyber-green/50 rounded-lg p-4 mb-8 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-cyber-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-cyber-green font-semibold">Model Trained Successfully!</p>
                  <p className="text-sm text-gray-400 mt-1">
                    You can now detect fraud in transaction files.
                  </p>
                </div>
              </div>
            )}

            {/* Results Display */}
            {results && (
              <div className="cyber-card p-8 rounded-xl">
                <h2 className="text-2xl font-bold text-cyber-green mb-6">Detection Results</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-cyber-darker p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold text-white">
                      {results.summary.total_transactions.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-cyber-darker p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Suspicious</p>
                    <p className="text-2xl font-bold text-cyber-red">
                      {results.summary.suspicious_count.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-cyber-darker p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">High Risk</p>
                    <p className="text-2xl font-bold text-cyber-orange">
                      {results.summary.high_risk_count.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-cyber-darker p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-cyber-green">
                      {(results.summary.average_fraud_score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Download Reports</h3>
                  <div className="flex space-x-4">
                    <a
                      href={`${API_BASE_URL}${results.download_links.csv}`}
                      className="cyber-button flex-1 text-center"
                      download
                    >
                      Download CSV
                    </a>
                    <a
                      href={`${API_BASE_URL}${results.download_links.xlsx}`}
                      className="bg-cyber-card border-2 border-cyber-green text-cyber-green px-8 py-3 rounded-lg hover:bg-cyber-green/10 transition-all flex-1 text-center"
                      download
                    >
                      Download Excel
                    </a>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={async () => {
                      if (!file) {
                        alert('No file selected. Please select a file first.');
                        return;
                      }

                      setLoadingDashboard(true);

                      try {
                        console.log('Loading dashboard data...');
                        console.log('Backend URL:', API_BASE_URL);

                        // Fetch detailed analysis data
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data',
                          },
                          timeout: 60000, // 60 second timeout
                        });

                        console.log('Analysis response:', response.data);

                        // Store in localStorage for dashboard
                        localStorage.setItem('fraudAnalysisData', JSON.stringify(response.data));

                        // Navigate to dashboard
                        window.location.href = '/dashboard';
                      } catch (err: any) {
                        console.error('Dashboard loading error:', err);
                        console.error('Error details:', {
                          message: err.message,
                          response: err.response,
                          code: err.code
                        });

                        let errorMessage = 'Unknown error';

                        if (err.code === 'ECONNABORTED') {
                          errorMessage = 'Request timeout - the analysis is taking too long';
                        } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                          errorMessage = 'Cannot connect to backend server. Make sure it is running on port 8000';
                        } else if (err.response?.data?.detail) {
                          errorMessage = err.response.data.detail;
                        } else if (err.message) {
                          errorMessage = err.message;
                        }

                        alert(`Failed to load dashboard data: ${errorMessage}\n\nPlease make sure:\n1. The model is trained\n2. The file is valid\n3. The backend server is running on http://localhost:8000\n4. Check the browser console for more details`);
                      } finally {
                        setLoadingDashboard(false);
                      }
                    }}
                    disabled={loadingDashboard}
                    className="w-full bg-cyber-green/10 border border-cyber-green text-cyber-green px-8 py-3 rounded-lg hover:bg-cyber-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loadingDashboard ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Loading Dashboard...</span>
                      </>
                    ) : (
                      <span>View Detailed Dashboard</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-12 cyber-card p-6 rounded-xl">
              <h3 className="text-xl font-bold text-white mb-4">Instructions</h3>
              <ol className="space-y-3 text-gray-400">
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green font-bold">1.</span>
                  <span>Upload your CSV file containing transaction data</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green font-bold">2.</span>
                  <span>Click "Train Model" to train the fraud detection system (first time only)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green font-bold">3.</span>
                  <span>Click "Detect Fraud" to analyze transactions and identify suspicious activity</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-cyber-green font-bold">4.</span>
                  <span>Download results as CSV or Excel and view detailed analytics</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
