// src/services/conceptExtractionService.ts
import ConceptMap, { Concept, ConceptRelationship } from '../models/ConceptMap';

export interface ConceptExtractionResult {
  concepts: Concept[];
  relationships: ConceptRelationship[];
}

/**
 * Extract key concepts from transcript segments
 * Identifies definitions, formulas, examples, principles, and processes
 */
export async function extractConceptsFromSegments(
  segments: Array<{ text: string; segmentIndex: number }>
): Promise<ConceptExtractionResult> {
  const concepts: Concept[] = [];
  const relationships: ConceptRelationship[] = [];
  const conceptMap = new Map<string, Concept>();

  for (const segment of segments) {
    // Extract definitions (pattern: "X is Y" or "X means Y")
    const definitionPattern = /(?:is|refers to|means|defined as)\s+([^.!?]+)/gi;
    let match;
    while ((match = definitionPattern.exec(segment.text)) !== null) {
      const definition = match[1].trim();
      const concept: Concept = {
        id: `concept_${Date.now()}_${Math.random()}`,
        term: extractTermFromContext(segment.text, match.index),
        definition,
        category: 'definition',
        segment: segment.segmentIndex
      };
      concepts.push(concept);
      conceptMap.set(concept.term.toLowerCase(), concept);
    }

    // Extract formulas (pattern: mathematical expressions)
    const formulaPattern = /([A-Za-z_]\w*\s*=\s*[^.!?]+)/g;
    while ((match = formulaPattern.exec(segment.text)) !== null) {
      const formula = match[0].trim();
      const concept: Concept = {
        id: `concept_${Date.now()}_${Math.random()}`,
        term: formula.split('=')[0].trim(),
        definition: formula,
        category: 'formula',
        segment: segment.segmentIndex
      };
      concepts.push(concept);
      conceptMap.set(concept.term.toLowerCase(), concept);
    }

    // Extract examples (pattern: "for example", "such as", "like")
    const examplePattern = /(?:for example|such as|like|e\.g\.)\s+([^.!?]+)/gi;
    while ((match = examplePattern.exec(segment.text)) !== null) {
      const exampleText = match[1].trim();
      const concept: Concept = {
        id: `concept_${Date.now()}_${Math.random()}`,
        term: `Example: ${exampleText.substring(0, 30)}...`,
        definition: exampleText,
        category: 'example',
        segment: segment.segmentIndex
      };
      concepts.push(concept);
    }

    // Extract principles (pattern: "principle of", "rule of")
    const principlePattern = /(?:principle of|rule of|law of)\s+([^.!?]+)/gi;
    while ((match = principlePattern.exec(segment.text)) !== null) {
      const principle = match[1].trim();
      const concept: Concept = {
        id: `concept_${Date.now()}_${Math.random()}`,
        term: principle,
        definition: `Principle: ${principle}`,
        category: 'principle',
        segment: segment.segmentIndex
      };
      concepts.push(concept);
      conceptMap.set(concept.term.toLowerCase(), concept);
    }

    // Extract processes (pattern: "process of", "steps of")
    const processPattern = /(?:process of|steps of|procedure|method)\s+([^.!?]+)/gi;
    while ((match = processPattern.exec(segment.text)) !== null) {
      const process = match[1].trim();
      const concept: Concept = {
        id: `concept_${Date.now()}_${Math.random()}`,
        term: process,
        definition: process,
        category: 'process',
        segment: segment.segmentIndex
      };
      concepts.push(concept);
      conceptMap.set(concept.term.toLowerCase(), concept);
    }
  }

  // Identify relationships between concepts
  for (const concept of concepts) {
    for (const otherConcept of concepts) {
      if (concept.id !== otherConcept.id) {
        // Simple heuristic: if concepts appear close in the text, they're related
        if (concept.segment === otherConcept.segment) {
          relationships.push({
            source: concept.id,
            target: otherConcept.id,
            relationship: 'related-to'
          });
        }

        // Check for causality patterns
        if (segment.text.includes('causes') || segment.text.includes('leads to')) {
          relationships.push({
            source: concept.id,
            target: otherConcept.id,
            relationship: 'causes'
          });
        }
      }
    }
  }

  return { concepts, relationships };
}

/**
 * Extract the term/concept name from context
 */
function extractTermFromContext(text: string, position: number): string {
  // Look backward to find the subject
  const beforeText = text.substring(Math.max(0, position - 100), position);
  const words = beforeText.trim().split(/\s+/);
  // Get the last 1-3 words as the term
  return words.slice(Math.max(0, words.length - 3)).join(' ');
}

/**
 * Save concept map to database
 */
export async function saveConceptMap(
  transcriptionId: string,
  concepts: Concept[],
  relationships: ConceptRelationship[]
): Promise<void> {
  try {
    const conceptMap = new ConceptMap({
      transcriptionId,
      concepts,
      relationships
    });
    await conceptMap.save();
    console.log(`Saved concept map for transcription: ${transcriptionId}`);
  } catch (error) {
    console.error('Error saving concept map:', error);
    throw error;
  }
}
