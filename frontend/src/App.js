import React, { useState } from 'react';
import './App.css';
import LogInput from './components/LogInput';
import ModeSelector from './components/ModeSelector';
import ResultDisplay from './components/ResultDisplay';
import { aiTroubleshoot } from './api';

function App() {
  const [logText, setLogText] = useState('');
  const [mode, setMode] = useState('beginner');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!logText.trim()) {
      setError('Please enter some log text');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await aiTroubleshoot(logText, {}, mode);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="status-indicator">
          <div className="status-dot"></div>
          System Secure
        </div>
        <h1>LogLore</h1>
        <div className="security-badge">
          PII Protection • Export Ready • Streamlined Workflow
        </div>
      </header>
      
      <main className="main-content">
        <div className="card">
          <h3 className="section-header">Error Log Input</h3>
          <LogInput logText={logText} setLogText={setLogText} />
        </div>

        <div className="card">
          <h3 className="section-header">Analysis Mode</h3>
          <ModeSelector mode={mode} setMode={setMode} />
        </div>
        
        <div className="submit-section">
          <button 
            onClick={handleSubmit}
            disabled={loading || !logText.trim()}
            className="submit-button"
          >
            {loading ? 'Analyzing Security Threats...' : 'Analyze Error Log'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>

        <ResultDisplay result={result} loading={loading} logText={logText} mode={mode} />
      </main>
    </div>
  );
}

export default App;
