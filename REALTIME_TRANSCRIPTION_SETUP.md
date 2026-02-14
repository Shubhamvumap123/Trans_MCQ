# 🚀 Real-Time Multi-Language Transcription & Enhanced MCQ Generation

## Overview

This guide covers the new real-time transcription and improved MCQ generation features added to the Trans_MCQ application.

### ✨ Key Features

1. **Real-Time Multi-Language Transcription**
   - Live transcription while video plays
   - Support for 5 languages: English, Hindi, Marathi, Kannada, Telugu
   - Multiple backend providers: Google Cloud, Azure, AssemblyAI, Ollama
   - Browser fallback using Web Speech API

2. **Enhanced MCQ Generation**
   - LLM-powered realistic question generation
   - Integration with OpenAI, Mistral, and Ollama
   - Misconception-based distractors
   - Bloom's taxonomy alignment
   - Real-life examples and context

3. **Quality Metrics & Analytics**
   - Transcription confidence scoring
   - MCQ quality assessment
   - Concept extraction
   - Performance recommendations

---

## 🔧 Backend Setup

### Prerequisites

```bash
# Environment variables required (add to .env)
TRANSCRIPTION_PROVIDER=google      # Options: google, azure, assemblyai, ollama
LLM_PROVIDER=openai                 # Options: openai, mistral, ollama

# Google Cloud Speech-to-Text (Optional - for production)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_API_KEY=your-api-key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Azure Speech Service (Optional)
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=southindia

# AssemblyAI (Optional - Recommended for quick setup)
ASSEMBLYAI_API_KEY=your-assemblyai-key

# OpenAI (Optional - for enhanced MCQ generation)
OPENAI_API_KEY=your-openai-key

# Mistral AI (Optional - Cost-effective alternative)
MISTRAL_API_KEY=your-mistral-key
```

### Installation Steps

#### 1. Install New Dependencies

```bash
cd trans_mcq_back
npm install --save axios
# Note: axios may already be installed, but ensure it's present
```

#### 2. New Service Files Created

The following services are now available:

- **`src/services/realtimeTranscriptionService.ts`**
  - GoogleCloudTranscriber
  - AzureSpeechTranscriber
  - AssemblyAITranscriber
  - WebSpeechTranscriber

- **`src/services/improveMCQGenerationService.ts`**
  - OpenAIQuestioner
  - MistralQuestioner
  - OllamaQuestioner

#### 3. New API Routes

- **`src/routes/realtimeTranscriptionRoutes.ts`** (6 endpoints)
  - `GET /api/transcription/languages` - Get supported languages
  - `POST /api/transcription/realtime/start` - Start transcription
  - `POST /api/transcription/realtime/segment` - Receive segment
  - `POST /api/transcription/realtime/finish` - Complete transcription
  - `GET /api/transcription/file/:fileId/confidence` - Get confidence metrics
  - `POST /api/transcription/file/:fileId/language` - Change language

- **`src/routes/improvedMCQRoutes.ts`** (4 endpoints)
  - `POST /api/questions/improved/generate` - Generate MCQs using LLM
  - `GET /api/questions/improved/transcription/:id` - Get MCQs with filtering
  - `GET /api/questions/improved/concepts/:id` - Extract key concepts
  - `GET /api/questions/improved/quality-metrics/:id` - Get quality scores

#### 4. Updated Models

**File Model** - Added fields:
```typescript
language: 'en' | 'hi' | 'mr' | 'kn' | 'te'
transcriptionProvider?: 'google' | 'azure' | 'assemblyai' | 'ollama'
enableRealtime?: boolean
```

**Transcription Model** - Added fields:
```typescript
transcriptionProvider?: string
averageConfidence?: number  // 0-1 score
segments[].confidence?: number  // Per-segment confidence
```

---

## 🌍 Backend Provider Setup

### Option 1: Google Cloud Speech-to-Text (Recommended for Production)

```bash
# 1. Create Google Cloud project
# https://console.cloud.google.com

# 2. Enable Speech-to-Text API
# https://console.cloud.google.com/apis/library/speech.googleapis.com

# 3. Create service account
# https://console.cloud.google.com/iam-admin/serviceaccounts

# 4. Generate JSON key and save as credentials.json

# 5. Update .env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
TRANSCRIPTION_PROVIDER=google

# 6. Install Google Cloud library
npm install --save @google-cloud/speech
```

**Supported Languages:**
```
English (India): en-IN
Hindi (India): hi-IN
Marathi (India): mr-IN
Kannada (India): kn-IN
Telugu (India): te-IN
```

### Option 2: AssemblyAI (Easiest Setup)

```bash
# 1. Sign up at https://www.assemblyai.com

# 2. Get API key from settings

# 3. Update .env
ASSEMBLYAI_API_KEY=your-api-key
TRANSCRIPTION_PROVIDER=assemblyai

# 4. Install SDK
npm install --save assemblyai
```

**Supported Languages:**
```
All 5 languages supported
Lower cost (~$3-5 per hour)
Easy setup
```

### Option 3: Azure Speech Services

```bash
# 1. Create Azure account
# https://portal.azure.com

# 2. Create Speech Services resource

# 3. Update .env
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=southindia
TRANSCRIPTION_PROVIDER=azure

# 4. Install SDK
npm install --save microsoft-cognitiveservices-speech-sdk
```

### Option 4: Local Ollama (Free, No API Keys)

```bash
# 1. Download Ollama
# https://ollama.ai

# 2. Run locally
ollama serve

# 3. Pull a model
ollama pull mistral

# 4. Update .env
TRANSCRIPTION_PROVIDER=ollama
LLM_PROVIDER=ollama

# Note: Ollama currently supports transcription via local models
# Limited language support compared to cloud services
```

---

## 💻 Frontend Setup

### 1. New Component

**`src/components/RealtimeTranscriptionPlayer.tsx`**

A complete video player component with:
- Real-time transcript display
- Language selection (5 languages)
- Confidence score visualization
- Interimand final transcripts
- Segment-level confidence metrics

### 2. Integration Example

```typescript
import RealtimeTranscriptionPlayer from '@/components/RealtimeTranscriptionPlayer';

export function VideoUploader() {
  const [language, setLanguage] = useState('en');

  const handleTranscriptionComplete = (segments: TranscriptSegment[]) => {
    // Send to backend
    await finishRealtimeTranscription(fileId, sessionId, segments);
    
    // Generate MCQs
    await generateImprovedMCQs(transcriptionId, {
      language,
      difficulty: 'mixed',
      questionCount: 5
    });
  };

  return (
    <RealtimeTranscriptionPlayer
      videoUrl={videoUrl}
      fileId={fileId}
      language={language}
      onLanguageChange={setLanguage}
      onTranscriptionComplete={handleTranscriptionComplete}
    />
  );
}
```

### 3. New API Functions

Added to `src/services/apiServices.ts`:

```typescript
// Transcription functions
getSupportedLanguages()
startRealtimeTranscription(fileId, language, options)
submitTranscriptionSegment(...)
finishRealtimeTranscription(...)
getTranscriptionConfidence(fileId)

// MCQ functions
generateImprovedMCQs(transcriptionId, options)
getImprovedMCQs(transcriptionId, filters)
extractConceptsFromTranscription(transcriptionId)
getMCQQualityMetrics(transcriptionId)
```

---

## 📡 API Endpoints Reference

### Real-Time Transcription

**GET** `/api/transcription/languages`
```json
Response:
{
  "success": true,
  "languages": [
    { "code": "en", "name": "English", "fullName": "English (India)" },
    { "code": "hi", "name": "Hindi", "fullName": "Hindi (India)" },
    ...
  ],
  "providers": {
    "available": "google",
    "supported": ["google", "azure", "assemblyai", "ollama"]
  }
}
```

**POST** `/api/transcription/realtime/start`
```json
Body:
{
  "fileId": "60d5ec49f1b2c72b8c8e4a1a",
  "language": "en",
  "detectSpeaker": false,
  "enablePunctuation": true
}

Response:
{
  "success": true,
  "fileId": "...",
  "language": "en",
  "languageName": "English (India)",
  "provider": "google",
  "features": {
    "speakerDetection": false,
    "automaticPunctuation": true
  }
}
```

**GET** `/api/transcription/file/:fileId/confidence`
```json
Response:
{
  "success": true,
  "averageConfidence": 95,
  "totalSegments": 12,
  "lowConfidenceSegments": 1,
  "details": {
    "excellent": 10,
    "good": 2,
    "fair": 0,
    "poor": 0
  },
  "recommendation": "Transcription quality is good"
}
```

### Improved MCQ Generation

**POST** `/api/questions/improved/generate`
```json
Body:
{
  "transcriptionId": "60d5ec49f1b2c72b8c8e4a1a",
  "language": "en",
  "difficulty": "mixed",
  "questionCount": 5,
  "enableMisconceptions": true
}

Response:
{
  "success": true,
  "generatedCount": 25,
  "config": {
    "language": "en",
    "difficulty": "mixed",
    "llmProvider": "openai"
  },
  "qualityMetrics": {
    "avgQuestionsPerSegment": "5.00",
    "diverseBloomLevels": 5,
    "includesMisconceptions": 23
  }
}
```

**GET** `/api/questions/improved/transcription/:transcriptionId`
```query parameters:
difficulty=medium
bloomLevel=Apply
objective=application
page=1
limit=10
```

**GET** `/api/questions/improved/concepts/:transcriptionId`
```json
Response:
{
  "success": true,
  "totalConcepts": 8,
  "byDifficulty": {
    "easy": 3,
    "medium": 3,
    "hard": 2
  },
  "concepts": [
    {
      "term": "Feature Scaling",
      "definition": "Process of normalizing features...",
      "difficulty": "medium",
      "relatedConcepts": ["normalization", "preprocessing"]
    },
    ...
  ]
}
```

**GET** `/api/questions/improved/quality-metrics/:transcriptionId`
```json
Response:
{
  "success": true,
  "metrics": {
    "totalQuestions": 25,
    "coverage": {
      "bloomLevels": 5,
      "difficulties": {
        "easy": 5,
        "medium": 12,
        "hard": 8
      }
    },
    "quality": {
      "withExplanations": 25,
      "withMisconceptions": 23,
      "optionsPerQuestion": {
        "min": 3,
        "max": 4,
        "average": "3.92"
      }
    },
    "overallQualityScore": {
      "score": 92,
      "level": "Excellent"
    },
    "recommendations": [...]
  }
}
```

---

## 🔌 LLM Provider Setup

### OpenAI (Best Quality)

```bash
# 1. Create account at https://openai.com/api

# 2. Generate API key from settings

# 3. Update .env
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai

# 4. Install package
npm install --save openai
```

**Costs:**
- GPT-3.5: ~$0.0005/1K tokens
- GPT-4: ~$0.003/1K tokens

### Mistral (Cost-Effective)

```bash
# 1. Create account at https://console.mistral.ai

# 2. Get API key

# 3. Update .env
MISTRAL_API_KEY=your-key
LLM_PROVIDER=mistral

# 4. Install package
npm install --save @mistralai/mistralai
```

**Costs:** ~60% cheaper than OpenAI

### Ollama (Free, Local)

```bash
# 1. Download from https://ollama.ai
# 2. Pull a model: ollama pull mistral
# 3. Set LLM_PROVIDER=ollama
# 4. No API key needed!

# Supported models:
# - mistral (7B parameters)
# - neural-chat
# - dolphin-mixtral
```

---

## 🧪 Testing the New Features

### 1. Test Real-Time Transcription

```bash
# Start transcription
curl -X POST http://localhost:5000/api/transcription/realtime/start \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "YOUR_FILE_ID",
    "language": "en",
    "detectSpeaker": false
  }'

# Get supported languages
curl http://localhost:5000/api/transcription/languages

# Get confidence metrics
curl http://localhost:5000/api/transcription/file/YOUR_FILE_ID/confidence
```

### 2. Test MCQ Generation

```bash
# Generate MCQs
curl -X POST http://localhost:5000/api/questions/improved/generate \
  -H "Content-Type: application/json" \
  -d '{
    "transcriptionId": "YOUR_TRANSCRIPTION_ID",
    "language": "en",
    "difficulty": "mixed",
    "questionCount": 5
  }'

# Get quality metrics
curl http://localhost:5000/api/questions/improved/quality-metrics/YOUR_TRANSCRIPTION_ID

# Extract concepts
curl http://localhost:5000/api/questions/improved/concepts/YOUR_TRANSCRIPTION_ID
```

---

## 🎯 Usage Workflow

### Complete User Flow

```
1. Upload Video
   |
   └─> File stored with language preference

2. Select Language & Start Real-Time Transcription
   |
   └─> Browser starts recording audio
   └─> Sends to transcription service
   └─> Live updates shown in UI

3. Transcription Completes
   |
   └─> Segments saved to database
   └─> Confidence scores calculated
   └─> Full transcript available

4. Generate Improved MCQs
   |
   └─> Send segments to LLM
   └─> LLM generates realistic questions
   └─> Questions saved with metadata

5. View Results
   |
   └─> See MCQs with explanations
   └─> Check quality metrics
   └─> Extract concepts
   └─> Export for use

6. Take Quiz
   |
   └─> Student answers questions
   └─> Get instant feedback
   └─> View analytics
```

---

## 📊 Example MCQ Generated

```json
{
  "question": "Based on the content about machine learning, what is the primary purpose of feature scaling?",
  "options": [
    {
      "text": "To normalize the range of independent variables",
      "isCorrect": true,
      "explanation": "Feature scaling ensures all features contribute equally...",
      "misconception": "Feature scaling is only needed for neural networks"
    },
    {
      "text": "To reduce the number of features",
      "isCorrect": false,
      "explanation": "That would be feature selection...",
      "misconception": "Scaling reduces the number of features"
    },
    ...
  ],
  "explanation": "Feature scaling is crucial for algorithms like gradient descent...",
  "difficulty": "medium",
  "bloomLevel": "Apply",
  "learningObjective": "application",
  "conceptsCovered": [
    "feature scaling",
    "preprocessing",
    "normalization"
  ],
  "realLifeExample": "In a dataset with age (18-80) and income (10,000-1,000,000)..."
}
```

---

## 🐛 Troubleshooting

### Issue: "Module not found: googleapis"

**Solution:**
```bash
npm install --save @google-cloud/speech
```

### Issue: Web Speech API not available

**Solution:** Add browser fallback:
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  console.warn('Web Speech API not supported');
  // Use server-based transcription
}
```

### Issue: Transcription not starting

**Checklist:**
- [ ] Browser supports Web Speech API (Chrome, Edge, Safari)
- [ ] Microphone permission granted
- [ ] Video is actually playing
- [ ] Language code is valid

### Issue: Low confidence scores

**Solutions:**
- Improve audio quality (quiet environment)
- Adjust microphone settings
- Try different language if accent is strong
- Check transcription provider settings

---

## 📈 Performance Metrics

### Backend Performance

| Operation | Time | Resources |
|-----------|------|-----------|
| Start transcription | <100ms | Minimal |
| Process segment | 1-2s | Varies by provider |
| Generate 5 MCQs | 3-10s | Depends on LLM |
| Extract concepts | 2-5s | CPU-bound |
| Quality assessment | <1s | In-memory |

### Frontend Performance

| Action | Time |
|--------|------|
| Language selection | 100ms |
| Transcription update | Real-time |
| Render segments | <50ms |
| Language switch | <500ms |

---

## 🔒 Security Considerations

1. **API Keys:**
   - Never commit `.env` file
   - Use environment variables only
   - Rotate keys regularly

2. **Data Privacy:**
   - Audio processed through chosen cloud provider
   - Review provider privacy policies
   - Option to use local Ollama for privacy

3. **Rate Limiting:**
   - Implemented on all endpoints
   - Protect against abuse
   - Configure based on tier

4. **Input Validation:**
   - Language codes validated
   - File IDs verified
   - Segment data sanitized

---

## 🚀 Deployment Checklist

- [ ] Install all dependencies
- [ ] Set up backend provider (Google/Azure/AssemblyAI)
- [ ] Set up LLM provider (OpenAI/Mistral/Ollama)
- [ ] Configure environment variables
- [ ] Test transcription endpoint
- [ ] Test MCQ generation endpoint
- [ ] Deploy backend to Render
- [ ] Update frontend with new components
- [ ] Deploy frontend to Vercel
- [ ] Test end-to-end workflow
- [ ] Monitor logs for errors

---

## 📚 Additional Resources

- [Google Cloud Speech-to-Text Docs](https://cloud.google.com/speech-to-text/docs)
- [AssemblyAI Documentation](https://www.assemblyai.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Bloom's Taxonomy](https://www.bloomstaxonomy.org/)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review API endpoint documentation
3. Check backend logs: `logs/app-{date}.log`
4. Verify environment variables
5. Test with provided endpoints

---

**Last Updated:** February 2026
**Version:** 2.0 - Real-Time Transcription and Enhanced MCQ Generation
