# Helmet Detection and License Plate Recognition using ML

An advanced AI-powered traffic safety system that monitors helmet compliance and automatically extracts vehicle license plate numbers using state-of-the-art Multimodal Transformer models.

## 🚀 Overview

This project provides an end-to-end solution for automated road safety enforcement. It identifies whether riders are wearing protective gear and, in case of violations, instantly recognizes and records the vehicle's license plate.

### Key Features
- **AI-Powered Analysis**: Uses **Google Gemini 2.5 Flash** (Multimodal Vision Engine) for simultaneous helmet detection and high-accuracy OCR.
- **ALPR Module**: Extracts exact alphanumeric license plate text directly from images with zero-shot intelligence.
- **Premium UI**: Modern dark-mode interface with glassmorphism effects, cinematic scanning animations, and real-time diagnostic reporting.
- **Real-time Processing**: Unified neural network pass for both detection and recognition tasks.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, React.
- **Backend**: FastAPI (Python 3.9+), Uvicorn.
- **AI Engine**: Google Gemini 2.5 Flash API (Multimodal Transformer).
- **Styling**: Modern dark-theme with glassmorphism and animated components.

## 📁 Project Structure

```
/
├── backend/                 # FastAPI Python service
│   ├── main.py             # Core logic & Gemini API integration
│   └── .env                # API Keys & Configuration
├── frontend/               # Next.js 15+ frontend application
│   ├── app/
│   │   ├── page.tsx        # Entry point
│   │   └── analyzer.tsx    # Main AI scanning interface
│   └── tailwind.config.ts  # Custom design tokens
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- A Google Gemini API Key


## 📄 License
MIT License
