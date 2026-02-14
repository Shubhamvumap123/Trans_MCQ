// src/models/ConceptMap.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface Concept {
  id: string;
  term: string;
  definition: string;
  category: 'definition' | 'formula' | 'example' | 'principle' | 'process';
  relatedTo?: string[]; // IDs of related concepts
  segment?: number;
}

export interface ConceptRelationship {
  source: string; // concept ID
  target: string; // concept ID
  relationship: string; // e.g., "causes", "is-part-of", "related-to"
}

export interface ConceptMapData extends Document {
  transcriptionId: mongoose.Types.ObjectId;
  concepts: Concept[];
  relationships: ConceptRelationship[];
  createdAt: Date;
  updatedAt: Date;
}

const conceptMapSchema = new Schema<ConceptMapData>({
  transcriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcription',
    required: true
  },
  concepts: [{
    id: String,
    term: String,
    definition: String,
    category: {
      type: String,
      enum: ['definition', 'formula', 'example', 'principle', 'process']
    },
    relatedTo: [String],
    segment: Number
  }],
  relationships: [{
    source: String,
    target: String,
    relationship: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ConceptMapData>('ConceptMap', conceptMapSchema);
