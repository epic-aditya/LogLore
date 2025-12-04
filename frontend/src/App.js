import React, { useState, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';
import { aiTroubleshoot, api } from './api';
import { SeverityBadge, detectPII } from './utils/severityUtils';
import { downloadAsMarkdown, downloadAsJSON, copyAsGitHubIssue } from './utils/exportUtils';

// ==========================================
// COMPONENTS
// ==========================================


const AnalysisProgress = ({ loading }) => {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { name: 'Processing Log', icon: '📄', duration: 1000 },
    { name: 'Redacting PII', icon: '🔒', duration: 1500 },
    { name: 'AI Analysis', icon: '🤖', duration: 2000 },
    { name: 'Generating Solution', icon: '✨', duration: 1000 }
  ];

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < stages.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [loading, stages.length]);

  if (!loading) return null;

  return (
    <div className="analysis-progress">
      <div className="progress-header">
        <h3>Analyzing Error Log</h3>
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="progress-stages">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={`progress-stage ${index <= currentStage ? 'active' : ''} ${index === currentStage ? 'current' : ''}`}
          >
            <div className="stage-icon">{stage.icon}</div>
            <div className="stage-name">{stage.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


const AnalysisLoadingSkeleton = () => {
  return (
    <div className="loading-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text-short"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text-medium"></div>
      </div>
      <div className="skeleton-steps">
        <div className="skeleton-step">
          <div className="skeleton-circle"></div>
          <div className="skeleton-step-text"></div>
        </div>
        <div className="skeleton-step">
          <div className="skeleton-circle"></div>
          <div className="skeleton-step-text"></div>
        </div>
        <div className="skeleton-step">
          <div className="skeleton-circle"></div>
          <div className="skeleton-step-text"></div>
        </div>
      </div>
    </div>
  );
};


const LogHighlighter = ({ code, language = "log", title, showCopyButton = true }) => {
  const [wrap, setWrap] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const trimmedCode = useMemo(() => (code || '').trim(), [code]);
  const isLong = trimmedCode.split('\n').length > 50;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trimmedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([trimmedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'log').toLowerCase().replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="premium-code-container">
      {title && (
        <div className="code-header">
          <span className="code-title">{title}</span>
          <div className="actions">
            <button onClick={() => setWrap(!wrap)} className="premium-copy-btn">
              {wrap ? 'No Wrap' : 'Wrap'}
            </button>
            <button onClick={handleDownload} className="premium-copy-btn">
              Download
            </button>
            {showCopyButton && (
              <button onClick={handleCopy} className="premium-copy-btn">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="code-wrapper">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          wrapLines={true}
          wrapLongLines={wrap}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            fontSize: '14px',
            maxHeight: expanded ? 'none' : '500px',
          }}
        >
          {trimmedCode}
        </SyntaxHighlighter>

        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="premium-copy-btn"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Show Full Log
          </button>
        )}
      </div>
    </div>
  );
};


const LogInput = ({ logText, setLogText }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (file) => {
    if (file) {
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 50);

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogText(e.target.result);
        setTimeout(() => setUploadProgress(0), 1000);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="log-input-container">
      <textarea
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
        placeholder="Paste your error log here or drag & drop a file..."
        rows={10}
        className="log-textarea"
      />

      <div
        className={`premium-file-upload ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-content">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,5 17,10" />
              <line x1="12" y1="5" x2="12" y2="15" />
            </svg>
          </div>

          <div className="upload-text">
            <h4>Drop your log files here</h4>
            <p>or <span className="browse-text">browse files</span></p>
            <small>Supports .txt, .log, .json formats</small>
          </div>

          <input
            type="file"
            accept=".txt,.log,.json"
            onChange={handleFileInputChange}
            className="hidden-file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-upload-button">
            Choose File
          </label>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="upload-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>

      <div className="file-info-section">
        <div className="char-count-badge">
          <span className="count-number">{logText.length}</span>
          <span className="count-label">characters</span>
        </div>

        {logText && (
          <button
            onClick={() => setLogText('')}
            className="clear-button-premium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};


const ModeSelector = ({ mode, setMode }) => {
  return (
    <div className="mode-options">
      <div
        className={`mode-option ${mode === 'beginner' ? 'selected' : ''}`}
        onClick={() => setMode('beginner')}
      >
        <input
          type="radio"
          name="mode"
          value="beginner"
          checked={mode === 'beginner'}
          onChange={() => setMode('beginner')}
        />
        <div className="mode-info">
          <h4>🚀 Beginner Mode</h4>
          <p>Clear explanations with step-by-step solutions. Perfect for quick fixes and learning.</p>
        </div>
      </div>

      <div
        className={`mode-option ${mode === 'advanced' ? 'selected' : ''}`}
        onClick={() => setMode('advanced')}
      >
        <input
          type="radio"
          name="mode"
          value="advanced"
          checked={mode === 'advanced'}
          onChange={() => setMode('advanced')}
        />
        <div className="mode-info">
          <h4>⚡ Advanced Mode</h4>
          <p>Technical analysis with commands, compliance audit, and data privacy controls.</p>
          <div className="advanced-features">
            <span className="feature-badge">🔐 Privacy Audit</span>
            <span className="feature-badge">📊 Compliance Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const PIIWarning = ({ text, onProceed, onCancel }) => {
  const piiFound = detectPII(text);

  if (piiFound.length === 0) return null;

  return (
    <div className="pii-warning">
      <div className="pii-header">
        <h4>⚠️ Potential PII Detected</h4>
        <p>We found the following sensitive information:</p>
      </div>

      <div className="pii-grid">
        {piiFound.map((pii, index) => (
          <div key={index} className="pii-item">
            <span className="pii-count">{pii.count}</span>
            <span className="pii-type">{pii.type}</span>
          </div>
        ))}
      </div>

      <p className="pii-note">This data will be automatically redacted before AI analysis.</p>

      <div className="warning-actions">
        <button onClick={onProceed} className="proceed-btn">
          Secure & Analyze
        </button>
        <button onClick={onCancel} className="cancel-btn">
          Edit Log
        </button>
      </div>
    </div>
  );
};


const TypewriterText = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-response-container">
      <div className="ai-response-header">
        <div className="ai-avatar">🤖</div>
        <div className="ai-info">
          <span className="ai-name">LogLore AI Assistant</span>
          <span className="ai-model">Powered by Gemini 2.0</span>
        </div>
        <div className="ai-header-actions">
          <div className="ai-status">
            <div className="status-dot active"></div>
            <span>Analysis Complete</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="response-copy-btn"
          >
            {copied ? '✅ Copied!' : '📋 Copy Response'}
          </button>
        </div>
      </div>
      <div className="ai-response-content">
        <div className="instant-response">
          <LogHighlighter
            code={text}
            language="markdown"
            showCopyButton={false}
            title={null}
          />
        </div>
      </div>
    </div>
  );
};


const ResultDisplay = ({ result, loading, logText, mode }) => {
  if (loading) {
    return (
      <>
        <AnalysisProgress loading={loading} />
        <div className="card">
          <AnalysisLoadingSkeleton />
        </div>
      </>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.8)' }}>
        <p>Submit an error log to see the analysis.</p>
      </div>
    );
  }

  const handleGitHubIssue = () => {
    copyAsGitHubIssue(result, logText, mode);
    alert('GitHub issue template copied!');
  };

  return (
    <div className="result-container">
      <div className="card result-section">
        <div className="section-header-with-privacy">
          <h3>Analysis</h3>
          <div className="privacy-badge">Redacted</div>
        </div>
        <SeverityBadge text={logText} />
        <TypewriterText text={result.answer} />
      </div>

      <div className="export-options">
        <h3>Export</h3>
        <div className="export-buttons">
          <button onClick={() => downloadAsMarkdown(result, logText, mode)} className="export-btn markdown">
            Report
          </button>
          <button onClick={() => downloadAsJSON(result, logText, mode)} className="export-btn json">
            JSON
          </button>
          <button onClick={handleGitHubIssue} className="export-btn github">
            GitHub Issue
          </button>
          {mode === 'advanced' && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.redacted);
                alert('Copied!');
              }}
              className="export-btn privacy"
            >
              Copy Redacted Log
            </button>
          )}
        </div>
      </div>

      {mode === 'advanced' && result?.redacted && (
        <div className="card result-section advanced-only">
          <h3>Redacted Log</h3>
          <p className="text-sm text-slate-400 mb-4">
            This is the sanitized version of the log sent for analysis.
          </p>
          <LogHighlighter
            code={result.redacted}
            language="log"
            title="Redacted Output"
          />
          <div className="privacy-footer mt-4">
            <div className="privacy-stats">
              <span className="stat">
                Redactions: <strong>{(result.redacted.match(/\[REDACTED_[A-Z0-9_]+\]/g) || []).length}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const SystemStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  const checkSystemHealth = async () => {
    try {
      const response = await api.get('/health');
      if (response.data.status === 'operational') {
        setStatus(response.data.gemini_configured ? 'active' : 'limited');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('offline');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'active':
        return {
          text: 'All Systems Operational',
          color: '#10b981',
          icon: '🟢',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'limited':
        return {
          text: 'Limited Functionality',
          color: '#f59e0b',
          icon: '🟡',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'error':
        return {
          text: 'Service Degraded',
          color: '#ef4444',
          icon: '🟠',
          bgColor: 'rgba(239, 68, 68, 0.1)'
        };
      case 'offline':
        return {
          text: 'System Offline',
          color: '#dc2626',
          icon: '🔴',
          bgColor: 'rgba(220, 38, 38, 0.1)'
        };
      default:
        return {
          text: 'Checking Status...',
          color: '#8b5cf6',
          icon: '⚪',
          bgColor: 'rgba(139, 92, 246, 0.1)'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className="system-status"
      style={{
        backgroundColor: statusInfo.bgColor,
        borderColor: `${statusInfo.color}30`
      }}
    >
      <div className="status-indicator">
        <div
          className="status-dot"
          style={{ backgroundColor: statusInfo.color }}
        ></div>
        <span style={{ color: statusInfo.color }}>
          {statusInfo.text}
        </span>
      </div>
      {lastCheck && (
        <div className="last-check">
          Last check: {lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [logText, setLogText] = useState('');
  const [mode, setMode] = useState('beginner');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPIIWarning, setShowPIIWarning] = useState(false);

  const handleAnalyzeClick = () => {
    if (!logText.trim()) {
      setError('Please enter a log to analyze.');
      return;
    }
    setError('');
    setShowPIIWarning(true);
  };

  const processAnalysis = async () => {
    setShowPIIWarning(false);
    setLoading(true);
    setError('');

    try {
      const data = await aiTroubleshoot(logText, {}, mode);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <SystemStatus />
        <h1>LogLore</h1>
        <div className="security-badge">
          <span>Secure Log Analysis Platform</span>
        </div>
      </header>

      <main className="main-content">
        <div className="card">
          <h3 className="section-header">Input Log</h3>
          <LogInput logText={logText} setLogText={setLogText} />
        </div>

        <div className="card">
          <h3 className="section-header">Analysis Mode</h3>
          <ModeSelector mode={mode} setMode={setMode} />
        </div>

        {showPIIWarning ? (
          <div className="card">
            <PIIWarning
              text={logText}
              onProceed={processAnalysis}
              onCancel={() => setShowPIIWarning(false)}
            />
            {/* Fallback if no PII found but warning state is true */}
            <button onClick={processAnalysis} style={{ display: 'none' }} ref={btn => btn && !document.querySelector('.pii-warning') && btn.click()}></button>
          </div>
        ) : (
          <div className="submit-section">
            <button
              onClick={handleAnalyzeClick}
              disabled={loading || !logText.trim()}
              className="submit-button"
            >
              {loading ? 'Analyzing...' : 'Analyze Log'}
            </button>
            {error && <p className="error-message">{error}</p>}
          </div>
        )}

        <ResultDisplay result={result} loading={loading} logText={logText} mode={mode} />
      </main>
    </div>
  );
}

export default App;
