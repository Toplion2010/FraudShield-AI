'use client';

import React, { useState } from 'react';
import { Shield, Upload, BarChart3, AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Animated background */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none"></div>

      {/* Hero Section */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyber-green/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-10 h-10 text-cyber-green" />
                <div>
                  <h1 className="text-2xl font-bold text-cyber-green cyber-glow">
                    FraudShield AI
                  </h1>
                  <p className="text-xs text-gray-400">v2.0 | Advanced Detection</p>
                </div>
              </div>
              <nav className="flex space-x-6">
                <Link href="/upload" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Upload
                </Link>
                <Link href="/dashboard" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Dashboard
                </Link>
                <Link href="/graph" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Graph
                </Link>
                <Link href="/docs" className="text-gray-300 hover:text-cyber-green transition-colors">
                  Docs
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-cyber-green/10 border border-cyber-green/30 rounded-full px-4 py-2 mb-8">
              <Lock className="w-4 h-4 text-cyber-green" />
              <span className="text-sm text-cyber-green font-semibold">
                Enterprise-Grade Security
              </span>
            </div>

            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-cyber-green to-cyber-blue bg-clip-text text-transparent">
              Detect Financial Fraud
              <br />
              Before It Happens
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Advanced hybrid AI system combining machine learning and rule-based detection
              to identify suspicious transactions with unmatched accuracy and explainability.
            </p>

            <div className="flex justify-center space-x-4 mb-16">
              <Link href="/upload">
                <button className="cyber-button flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Start Detection</span>
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-cyber-card border border-cyber-green/30 text-cyber-green px-8 py-3 rounded-lg hover:bg-cyber-green/10 transition-all">
                  View Dashboard
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="cyber-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-cyber-green mb-2">99.2%</div>
                <div className="text-sm text-gray-400">Detection Accuracy</div>
              </div>
              <div className="cyber-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-cyber-green mb-2">&lt;100ms</div>
                <div className="text-sm text-gray-400">Response Time</div>
              </div>
              <div className="cyber-card p-6 rounded-xl">
                <div className="text-3xl font-bold text-cyber-green mb-2">Real-time</div>
                <div className="text-sm text-gray-400">Processing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-cyber-green">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div
              className="cyber-card p-8 rounded-xl cursor-pointer"
              onMouseEnter={() => setIsHovered('hybrid')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <div className={`w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6 transition-all ${
                isHovered === 'hybrid' ? 'shadow-glow-green' : ''
              }`}>
                <Shield className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hybrid Detection</h3>
              <p className="text-gray-400">
                Combines Isolation Forest, AutoEncoder neural networks, and rule-based
                systems for comprehensive fraud detection.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="cyber-card p-8 rounded-xl cursor-pointer"
              onMouseEnter={() => setIsHovered('explain')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <div className={`w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6 transition-all ${
                isHovered === 'explain' ? 'shadow-glow-green' : ''
              }`}>
                <AlertTriangle className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Explainable AI</h3>
              <p className="text-gray-400">
                SHAP-powered explanations for every suspicious transaction. Understand
                exactly why each alert was triggered.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="cyber-card p-8 rounded-xl cursor-pointer"
              onMouseEnter={() => setIsHovered('realtime')}
              onMouseLeave={() => setIsHovered(null)}
            >
              <div className={`w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6 transition-all ${
                isHovered === 'realtime' ? 'shadow-glow-green' : ''
              }`}>
                <TrendingUp className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time Analysis</h3>
              <p className="text-gray-400">
                Process thousands of transactions per second with sub-100ms latency.
                Perfect for high-volume operations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="cyber-card p-8 rounded-xl">
              <div className="w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Visual Analytics</h3>
              <p className="text-gray-400">
                Interactive dashboards with anomaly heatmaps, risk distributions, and
                temporal pattern analysis.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="cyber-card p-8 rounded-xl">
              <div className="w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6">
                <Upload className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Easy Integration</h3>
              <p className="text-gray-400">
                Simple CSV upload interface with Excel/CSV export. RESTful API for
                seamless integration with existing systems.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="cyber-card p-8 rounded-xl">
              <div className="w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-cyber-green" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Enterprise Security</h3>
              <p className="text-gray-400">
                Bank-grade encryption, GDPR compliant, and designed for both B2B and
                B2C fraud prevention.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 text-cyber-green">
            How It Works
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: '01',
                title: 'Upload Transaction Data',
                description: 'Upload your CSV file containing financial transaction records.',
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our hybrid ML+Rules engine analyzes patterns, amounts, frequencies, and behavioral anomalies.',
              },
              {
                step: '03',
                title: 'Get Results',
                description: 'Download comprehensive reports with fraud scores, risk levels, and detailed explanations.',
              },
              {
                step: '04',
                title: 'Visualize Insights',
                description: 'Explore interactive dashboards showing anomaly patterns, distributions, and trends.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start space-x-6 cyber-card p-6 rounded-xl">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-cyber-green/10 flex items-center justify-center border border-cyber-green/30">
                  <span className="text-2xl font-bold text-cyber-green">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-6 py-20">
          <div className="cyber-card p-12 rounded-2xl text-center max-w-3xl mx-auto border-2 border-cyber-green/30">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Protect Your Business?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Start detecting fraud with advanced AI in minutes.
            </p>
            <Link href="/upload">
              <button className="cyber-button text-lg px-10 py-4">
                Get Started Now
              </button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-cyber-green/20 py-8">
          <div className="container mx-auto px-6 text-center text-gray-500">
            <p>© 2024 FraudShield AI. Advanced Fraud Detection System.</p>
            <p className="text-sm mt-2">Built with AI/ML • Real-time Processing • Enterprise Security</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
