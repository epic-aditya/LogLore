<p align="center">
  <img src="frontend/public/logo512.png" alt="LogLore logo" width="200">
</p>

# LogLore - AI-Powered Secure Log Analysis


**LogLore** is a secure, intelligent log analysis platform designed to help developers and system administrators troubleshoot errors instantly. Powered by **Google Gemini 2.0**, it provides deep insights, root cause analysis, and actionable fixes while ensuring sensitive data (PII) is automatically redacted before processing.

## 🚀 Key Features

*   **🛡️ Privacy-First Architecture**: Automatically detects and redacts PII (Emails, IPs, API Keys, Passwords) *before* data leaves your browser/server.
*   **🤖 AI-Driven Insights**: Uses Gemini 2.0 to analyze stack traces and error logs, offering "Beginner" (simple explanations) and "Advanced" (technical RCA) modes.
*   **🎨 Modern Dark UI**: A sleek, responsive, and developer-friendly interface with syntax highlighting and smooth animations.
*   **⚡ Real-Time Health Checks**: Monitors backend connectivity and AI service status.
*   **📂 Multi-Format Support**: Drag-and-drop support for `.txt`, `.log`, and `.json` files.
*   **📊 Export & Share**: Download reports as Markdown/JSON or copy directly to GitHub Issues.

## 🛠️ Tech Stack

*   **Frontend**: React.js, CSS3 (Custom Dark Theme), Axios
*   **Backend**: Python FastAPI, Uvicorn
*   **AI Engine**: Google Gemini 2.0 Flash
*   **Security**: Client-side & Server-side Regex Redaction

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/epic-aditya/LogLore.git

cd LogLore
```

### 2. Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create a .env file in the backend directory and add:
# GEMINI_API_KEY=your_api_key_here
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🏃‍♂️ Running the Application

**Start the Backend Server:**
```bash
cd backend
python main.py
# Server runs on http://localhost:8000
```

**Start the Frontend Client:**
```bash
cd frontend
npm start
# Client runs on http://localhost:3000
```

## 📖 Usage Guide

1.  **Input Log**: Paste your error log into the text area or drag-and-drop a log file.
2.  **Select Mode**:
    *   **Beginner**: Get simple, step-by-step fix instructions.
    *   **Advanced**: Get a detailed Root Cause Analysis (RCA) and prevention strategies.
3.  **Review PII**: LogLore will warn you if sensitive data is detected. You can review the counts before proceeding.
4.  **Analyze**: Click "Analyze Log" to get AI-powered insights.
5.  **Export**: Save the analysis as a report or copy the redacted log for safe sharing.
## How it works diagram
```
User log/input
      │
      ▼
┌───────────────┐
│ React Frontend│
│ (log editor,  │
│ mode select)  │
└──────┬────────┘
       │
       │ raw log
       ▼
┌──────────────┐
│ Client PII   │
│ redaction    │
│ (regex)      │
└──────┬───────┘
       │
       │ redacted log
       ▼
┌──────────────┐
│ FastAPI      │
│ backend +    │
│ extra checks │
└──────┬───────┘
       │
       │ prompt + redacted log
       ▼
┌──────────────┐
│ Gemini 2.0   │
│ analysis     │
└──────┬───────┘
       │
       │ insights, RCA, fixes
       ▼
┌──────────────┐
│ React result │
│ view + export│
└──────────────┘

```
## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
