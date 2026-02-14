# Advanced Content Extraction & Quiz Generation Enhancement

## Overview

This enhancement implements a sophisticated content extraction and MCQ generation system based on Bloom's taxonomy and educational best practices.

## Features Implemented

### 1. **Enhanced Transcription with Speaker Labels & Normalization**

**File**: `src/models/Transcription.ts`

Features:
- Speaker identification and labeling
- Proper punctuation normalization
- Timestamp tracking at segment level
- Support for multi-speaker content
- Normalized transcript with structured formatting

**Data Structure**:
```json
{
  "segments": [
    {
      "startTime": 0,
      "endTime": 300,
      "text": "Raw transcribed text",
      "speaker": "Instructor",
      "normalizedText": "Properly formatted text with punctuation.",
      "segmentIndex": 0
    }
  ],
  "hasMultipleSpeakers": true,
  "normalizedTranscript": "Full normalized transcript"
}
```

---

### 2. **Concept Map Extraction**

**File**: `src/models/ConceptMap.ts` & `src/services/conceptExtractionService.ts`

Automatically extracts:
- **Definitions**: Key terms and their meanings
- **Formulas**: Mathematical expressions and equations
- **Examples**: Illustrative cases mentioned in lecture
- **Principles**: Fundamental rules and laws
- **Processes**: Step-by-step procedures

Identifies relationships:
- `causes` - Causal relationships
- `is-part-of` - Hierarchical relationships
- `related-to` - General associations

**Data Structure**:
```json
{
  "concepts": [
    {
      "id": "concept_123",
      "term": "Photosynthesis",
      "definition": "Process by which plants convert sunlight into chemical energy",
      "category": "process",
      "segment": 5,
      "relatedTo": ["concept_124", "concept_125"]
    }
  ],
  "relationships": [
    {
      "source": "concept_123",
      "target": "concept_124",
      "relationship": "causes"
    }
  ]
}
```

---

### 3. **Enhanced Question Model with Bloom's Taxonomy**

**File**: `src/models/Question.ts`

Each question now includes:

#### A. Learning Objectives (Bloom's Taxonomy):
- **Recall** (Remember): Basic factual knowledge
- **Application** (Apply): Using knowledge in new situations
- **Analysis** (Analyze): Breaking down and understanding relationships

#### B. Bloom's Levels:
- Remember
- Understand
- Apply
- Analyze
- Evaluate
- Create

#### C. Question Structure:
```json
{
  "question": "What is photosynthesis?",
  "options": [
    {
      "text": "Correct answer",
      "isCorrect": true,
      "explanation": "Why this is correct..."
    },
    {
      "text": "Distractor based on common misconception",
      "isCorrect": false,
      "explanation": "Why this is incorrect...",
      "misconception": "Students often confuse X with Y"
    }
  ],
  "correctAnswerIndex": 0,
  "difficulty": "easy",
  "learningObjective": "recall",
  "bloomLevel": "Remember",
  "timestamp": { "start": 120, "end": 180 },
  "segmentText": "Original segment text...",
  "explanation": "Comprehensive explanation..."
}
```

---

### 4. **Misconception-Based Distractors**

**File**: `src/services/enhancedQuestionService.ts`

Distractors are generated based on:
- Common student misconceptions
- Related but incorrect concepts
- Reversed causality
- Over-generalization
- Partial understanding

**Example**:
```json
{
  "question": "Why does water boil at lower temperatures at higher altitudes?",
  "options": [
    {
      "text": "Lower atmospheric pressure requires less heat to reach the boiling point",
      "isCorrect": true,
      "explanation": "Correct causal relationship..."
    },
    {
      "text": "Water molecules are weaker at higher altitudes",
      "isCorrect": false,
      "explanation": "Misconception: Properties of water don't change with altitude",
      "misconception": "Attributing molecular changes to location"
    },
    {
      "text": "Higher temperatures at altitude cause water to boil faster",
      "isCorrect": false,
      "explanation": "Misconception: Altitude actually has cooler temperatures",
      "misconception": "Confusing altitude with temperature"
    }
  ]
}
```

---

### 5. **Three-Level Difficulty Scale**

Questions are tagged with:
- **Easy**: Recall-level questions, direct from transcript
- **Medium**: Application questions, requires understanding
- **Hard**: Analysis questions, requires synthesis and reasoning

---

### 6. **Structured JSON Output Format**

All data follows this comprehensive structure:

```json
{
  "timestamp": {
    "start": 120,
    "end": 180
  },
  "speaker": "Instructor",
  "text": "Original segment text",
  "concepts": [
    {
      "term": "Photosynthesis",
      "category": "process",
      "definition": "..."
    }
  ],
  "questions": [
    {
      "question": "...",
      "options": [
        {
          "text": "...",
          "isCorrect": true,
          "explanation": "..."
        }
      ],
      "correct_answer": 0,
      "explanation": "...",
      "difficulty": "medium",
      "learningObjective": "application",
      "bloomLevel": "Apply",
      "references": {
        "segmentIndex": 5,
        "timestamp": { "start": 120, "end": 180 }
      }
    }
  ]
}
```

---

## Question Generation Strategy

### Question Types by Learning Objective:

#### 1. **Recall Questions** (Easy)
```
Pattern: "What is X?", "Define X", "Which of the following is X?"
Focus: Direct factual knowledge from transcript
Bloom's Level: Remember
```

#### 2. **Application Questions** (Medium)
```
Pattern: "In context Y, what should be done?", "How would you apply X to..."
Focus: Using knowledge in practical scenarios
Bloom's Level: Apply
Misconceptions: Wrong applications, partial understanding
```

#### 3. **Analysis Questions** (Hard)
```
Pattern: "Why does X happen?", "What is the relationship between X and Y?"
Focus: Understanding causality and relationships
Bloom's Level: Analyze
Misconceptions: Reversed causality, confusing correlations
```

---

## API Endpoints

### Get Concept Map
```
GET /api/questions/transcription/{transcriptionId}/concepts
Response: Concept map with all extracted concepts and relationships
```

### Get Questions by Learning Objective
```
GET /api/questions/transcription/{transcriptionId}?objective=recall|application|analysis
Response: Filtered questions by learning objective
```

### Get Questions by Difficulty
```
GET /api/questions/transcription/{transcriptionId}?difficulty=easy|medium|hard
Response: Filtered questions by difficulty level
```

### Get Complete Learning Package
```
GET /api/questions/transcription/{transcriptionId}/complete
Response: {
  "transcription": { ... },
  "conceptMap": { ... },
  "questions": [ ... ],
  "learningPath": [ ... ]
}
```

---

## Usage Example

### For Students:
1. Upload lecture audio → System extracts concepts
2. View concept map to understand relationships
3. Take quizzes filtered by:
   - Learning objective (recall → application → analysis)
   - Difficulty level
   - Timestamp (specific portion of lecture)
4. See explanations for correct and incorrect answers
5. Identify personal misconceptions

### For Educators:
1. Review automatically generated concept maps
2. Customize difficulty levels and objectives
3. Export question bank in standard format
4. Track student performance by learning objective
5. Identify common misconceptions in class

---

## Technical Implementation

### Services:
- `conceptExtractionService.ts`: Extracts concepts and relationships
- `enhancedQuestionService.ts`: Generates questions by Bloom's level
- `transcriptionService.ts`: Processes audio with speaker labels

### Models:
- `Transcription.ts`: Enhanced with speakers and normalization
- `Question.ts`: Extended with learning objectives and misconceptions
- `ConceptMap.ts`: New model for concept mapping

### Quality Assurance:
- Factual consistency with provided content
- No hallucinated content
- Traceable references to original segments
- Explanations grounded in lecture material

---

## Future Enhancements

1. **LLM Integration**: Replace pattern matching with LLM-based extraction
2. **Adaptive Learning**: Adjust difficulty based on student performance
3. **Multi-language Support**: Process lectures in multiple languages
4. **Video Transcription**: Extract slides and visual elements
5. **Real-time Processing**: Stream-based processing for live lectures
6. **Interactive Concept Maps**: Visual, interactive concept relationship exploration

---

## References

- Bloom's Taxonomy of Educational Objectives (Anderson & Krathwohl, 2001)
- Misconception-driven Instruction (Hammer, 1996)
- Educational Assessment Best Practices (Wiggins & McTighe, 2005)

