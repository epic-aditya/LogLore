import React from 'react';

const ModeSelector = ({ mode, setMode }) => {
  return (
    <div className="mode-selector">
      <div className="mode-options">
        <label className={`mode-option ${mode === 'beginner' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="beginner"
            checked={mode === 'beginner'}
            onChange={(e) => setMode(e.target.value)}
          />
          <div className="mode-info">
            <h4>Beginner</h4>
            <p>Clear, step-by-step explanations</p>
          </div>
        </label>
        
        <label className={`mode-option ${mode === 'advanced' ? 'selected' : ''}`}>
          <input
            type="radio"
            value="advanced"
            checked={mode === 'advanced'}
            onChange={(e) => setMode(e.target.value)}
          />
          <div className="mode-info">
            <h4>Advanced</h4>
            <p>Technical solutions for professionals</p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default ModeSelector;
