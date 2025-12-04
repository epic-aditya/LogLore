import re

# Compiled regex patterns for PII redaction
PATTERNS = [
    # Stripe Keys
    (r'(?i)sk_live_[A-Za-z0-9_\-]{8,}', '[REDACTED_STRIPE_LIVE_KEY]', re.IGNORECASE),
    (r'(?i)sk_test_[A-Za-z0-9_\-]{8,}', '[REDACTED_STRIPE_TEST_KEY]', re.IGNORECASE),
    (r'(?i)pk_live_[A-Za-z0-9_\-]{8,}', '[REDACTED_STRIPE_PUBLIC_KEY]', re.IGNORECASE),
    (r'(?i)rk_live_[A-Za-z0-9_\-]{8,}', '[REDACTED_STRIPE_RESTRICTED_KEY]', re.IGNORECASE),

    # Cloud Provider Keys
    (r'\bAKIA[0-9A-Z]{12,20}\b', '[REDACTED_AWS_ACCESS_KEY]', 0),
    (r'\bAIza[0-9A-Za-z\-_]{10,}\b', '[REDACTED_GOOGLE_API_KEY]', 0),
    (r'\bghp_[A-Za-z0-9]{20,}\b', '[REDACTED_GITHUB_TOKEN]', 0),
    (r'\bsk-[A-Za-z0-9]{20,}\b', '[REDACTED_OPENAI_KEY]', 0),

    # Standard Tokens
    (r'eyJ[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+', '[REDACTED_JWT]', 0),
    (r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '[REDACTED_UUID]', re.IGNORECASE),

    # Credentials in URLs
    (r'(?i)([a-zA-Z][a-zA-Z0-9+.-]*://)([^:@\s]+):([^@\s]+)@', r'\1[REDACTED_USER]:[REDACTED_PASSWORD]@', re.IGNORECASE),
    
    # JSON/Key-Value pairs
    (r'(?i)"(key|secret|token|password|access[_-]?key|private[_-]?key|api[_-]?key)"\s*:\s*"([^"]+)"', r'"\1": "[REDACTED]"', re.IGNORECASE),
    (r'(?i)\b(secret|client_secret|access[_-]?key|private[_-]?key|api[_-]?key)\b\s*[:=]\s*["\']?([^"\'\s;]+)', r'\1="[REDACTED]"', re.IGNORECASE),

    # Personal Info
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', '[REDACTED_EMAIL]', 0),
    (r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', 0),
    (r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '[REDACTED_CARD]', 0),
    (r'\+?\d{1,2}\s?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}', '[REDACTED_PHONE]', 0),

    # Network
    (r'(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)', '[REDACTED_IP]', 0),
    (r'(?i)(?:[A-Fa-f0-9]{1,4}:){2,7}[A-Fa-f0-9]{1,4}', '[REDACTED_IPV6]', re.IGNORECASE),
    (r'\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b', '[REDACTED_MAC]', 0),

    # Private Keys
    (r'-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----.*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----', '[REDACTED_PRIVATE_KEY]', re.DOTALL),
]
