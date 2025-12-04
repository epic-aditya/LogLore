export const getSeverityLevel = (text) => {
  const criticalKeywords = ['fatal', 'critical', 'emergency', 'panic', 'security breach'];
  const highKeywords = ['error', 'failed', 'exception', 'timeout', 'denied'];
  const mediumKeywords = ['warning', 'deprecated', 'retry', 'slow'];
  // kept for future use; unused in current logic
  // eslint-disable-next-line no-unused-vars
  const lowKeywords = ['info', 'debug', 'notice', 'success'];

  const lowerText = text.toLowerCase();

  if (criticalKeywords.some(keyword => lowerText.includes(keyword))) {
    return { level: 'CRITICAL', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' };
  }
  if (highKeywords.some(keyword => lowerText.includes(keyword))) {
    return { level: 'HIGH', color: '#ea580c', bgColor: 'rgba(234, 88, 12, 0.1)' };
  }
  if (mediumKeywords.some(keyword => lowerText.includes(keyword))) {
    return { level: 'MEDIUM', color: '#ca8a04', bgColor: 'rgba(202, 138, 4, 0.1)' };
  }
  return { level: 'LOW', color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' };
};

export const SeverityBadge = ({ text }) => {
  const severity = getSeverityLevel(text);

  return (
    <div
      className="severity-badge"
      style={{
        color: severity.color,
        backgroundColor: severity.bgColor,
        border: `1px solid ${severity.color}30`
      }}
    >
      <div
        className="severity-dot"
        style={{ backgroundColor: severity.color }}
      ></div>
      {severity.level}
    </div>
  );
};

// PII detection for client-side validation
export const detectPII = (text) => {
  const piiPatterns = [
    // Stripe
    { type: 'STRIPE_KEY', regex: /sk_(?:live|test)_[A-Za-z0-9_\-]{8,}/gi },
    { type: 'STRIPE_KEY', regex: /(?:pk|rk)_live_[A-Za-z0-9_\-]{8,}/gi },

    // Cloud & API Keys
    { type: 'AWS_KEY', regex: /\bAKIA[0-9A-Z]{12,20}\b/g },
    { type: 'GOOGLE_KEY', regex: /\bAIza[0-9A-Za-z\-_]{10,}\b/g },
    { type: 'GITHUB_TOKEN', regex: /\bghp_[A-Za-z0-9]{20,}\b/g },
    { type: 'OPENAI_KEY', regex: /\bsk-[A-Za-z0-9]{20,}\b/g },

    // Standard Tokens
    { type: 'JWT', regex: /eyJ[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+/g },
    { type: 'UUID', regex: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi },

    // Credentials
    { type: 'PASSWORD', regex: /"(?:password|secret|token|key)"\s*:\s*"([^"]+)"/gi },
    { type: 'PASSWORD', regex: /\b(?:password|secret|key)\b\s*[:=]\s*["']?([^"'\s;]+)/gi },

    // Personal Info
    { type: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { type: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: 'CREDIT_CARD', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
    { type: 'PHONE', regex: /\+?\d{1,2}\s?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/g },

    // Network
    { type: 'IP_ADDRESS', regex: /(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/g },
    { type: 'MAC_ADDRESS', regex: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g },

    // Private Keys
    { type: 'PRIVATE_KEY', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g },
  ];

  const counts = {};

  piiPatterns.forEach(({ type, regex }) => {
    const matches = text.match(regex);
    if (matches) {
      counts[type] = (counts[type] || 0) + matches.length;
    }
  });

  return Object.entries(counts).map(([type, count]) => ({ type, count }));
};
