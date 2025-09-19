import React, { useState } from 'react';

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

export default LogInput;
