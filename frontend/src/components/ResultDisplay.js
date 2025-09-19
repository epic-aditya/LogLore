import React from 'react';
import { downloadAsMarkdown, downloadAsJSON, copyAsGitHubIssue } from '../utils/exportUtils';

const ResultDisplay = ({ result, loading, logText, mode }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <h3>Analyzing your error...</h3>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'rgba(148, 163, 184, 0.8)' }}>
        <p>Submit an error log above to get AI-powered troubleshooting guidance</p>
      </div>
    );
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleGitHubIssue = () => {
    copyAsGitHubIssue(result, logText, mode);
    alert('GitHub issue template copied to clipboard!');
  };

  return (
    <div className="result-container">
      <div className="card result-section">
        <h3>AI Solution</h3>
        <div className="solution-block">
          <div className="solution-content">
            {result.answer}
          </div>
          <button 
            onClick={() => copyToClipboard(result.answer)}
            className="copy-button"
          >
            Copy Solution
          </button>
        </div>
      </div>

      <div className="export-options">
        <h3>Export Options</h3>
        <div className="export-buttons">
          <button 
            onClick={() => downloadAsMarkdown(result, logText, mode)}
            className="export-btn markdown"
          >
            📄 Download as Markdown
          </button>
          <button 
            onClick={() => downloadAsJSON(result, logText, mode)}
            className="export-btn json"
          >
            📋 Download as JSON
          </button>
          <button 
            onClick={handleGitHubIssue}
            className="export-btn github"
          >
            🐙 Copy GitHub Issue
          </button>
        </div>
      </div>

      <div className="card result-section">
        <h3>Redacted Log</h3>
        <div className="code-block">
          <pre>{result.redacted}</pre>
          <button 
            onClick={() => copyToClipboard(result.redacted)}
            className="copy-button"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
