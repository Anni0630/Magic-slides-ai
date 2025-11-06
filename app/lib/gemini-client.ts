import { GoogleGenerativeAI } from '@google/generative-ai';

// Using your model structure
const AVAILABLE_MODELS = [
  'models/gemini-2.5-flash',  // Fast and efficient
        'models/gemini-2.5-pro',    // More capable
        'models/gemini-2.0-flash',  // Fallback option          // Reliable fallback
];

export interface Slide {
  title: string;
  content: string[];
  layout: 'TITLE' | 'TITLE_CONTENT' | 'SECTION_HEADER';
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    // Use NEXT_PUBLIC_ prefix for client-side environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is not set in environment variables.');
      console.error('💡 Make sure your .env.local file contains: NEXT_PUBLIC_GEMINI_API_KEY=your_key_here');
      throw new Error('GEMINI_API_KEY is not set in environment variables. Get a free key from: https://aistudio.google.com/apikey');
    }
    
    console.log('🔧 Initializing Gemini service...');
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.initializeModel();
  }

  private initializeModel() {
    // Try models in order of preference
    for (const modelName of AVAILABLE_MODELS) {
      try {
        this.model = this.genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        });
        console.log(`✅ Using model: ${modelName}`);
        break;
      } catch (error) {
        console.log(`❌ Model ${modelName} not available, trying next...`);
      }
    }

    if (!this.model) {
      throw new Error('No available Gemini models found');
    }
  }

  async generateSlides(prompt: string, existingSlides: Slide[] = []): Promise<Slide[]> {
    try {
      const systemPrompt = this.buildSystemPrompt(existingSlides);
      const fullPrompt = `${systemPrompt}\n\nUSER REQUEST: ${prompt}`;

      console.log('📤 Sending request to Gemini...');
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('📥 Received response from Gemini');
      return this.parseResponse(text);
    } catch (error) {
      console.error('❌ Error generating slides:', error);
      throw new Error('Failed to generate presentation content. Please try again.');
    }
  }

  private buildSystemPrompt(existingSlides: Slide[]): string {
    let prompt = `You are an expert presentation designer. Create structured PowerPoint slides.

ALWAYS respond with VALID JSON in this exact format:
{
  "slides": [
    {
      "title": "Slide Title",
      "content": ["Point 1", "Point 2", "Point 3"],
      "layout": "TITLE_CONTENT"
    }
  ]
}

LAYOUT TYPES:
- "TITLE": Title slide (usually first slide)
- "TITLE_CONTENT": Normal slide with title and bullet points
- "SECTION_HEADER": Section divider slide

GUIDELINES:
- Create 3-8 slides depending on the topic
- Use clear, professional language
- Each bullet point should be concise
- Ensure logical flow between slides
- Make titles engaging but professional`;

    if (existingSlides.length > 0) {
      prompt += `\n\nEXISTING SLIDES: ${JSON.stringify(existingSlides, null, 2)}\n\nMODIFY the existing slides based on the user's request. Keep what works, change what doesn't.`;
    } else {
      prompt += `\n\nCREATE a new presentation based on the user's request.`;
    }

    return prompt;
  }

  private parseResponse(text: string): Slide[] {
    try {
      // Clean the response text
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      
      // Find JSON in the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('Invalid slides format');
      }

      console.log(`✅ Generated ${parsed.slides.length} slides`);
      return parsed.slides;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw new Error('Failed to parse AI response. Please try again.');
    }
  }
}

// Create a singleton instance
export const geminiService = new GeminiService();

export function getGeminiService() {
  return geminiService;
}