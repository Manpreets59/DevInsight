import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface CodeAnalysisResult {
  codeHealth: {
    score: number;
    summary: string;
  };
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    file: string;
    message: string;
    suggestion: string;
  }>;
  recommendations: Array<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
  }>;
  metrics: {
    linesOfCode: number;
    filesCount: number;
    avgComplexity: number;
    dependencies: number;
  };
}

// Choose your AI provider
const AI_PROVIDER = process.env.GEMINI_API_KEY ? 'gemini' : 
                    process.env.GROQ_API_KEY ? 'groq' : null;

async function analyzeWithGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

async function analyzeWithGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not found');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile', // Fast and capable
    temperature: 0.3,
    max_tokens: 4096,
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

export async function analyzeRepository(
  repoInfo: any,
  languages: any,
  issues: any[]
): Promise<CodeAnalysisResult> {
  const prompt = `Analyze this GitHub repository and provide detailed insights:

Repository: ${repoInfo.fullName}
Description: ${repoInfo.description || 'No description'}
Primary Language: ${repoInfo.language}
Stars: ${repoInfo.stars}
Forks: ${repoInfo.forks}
Languages Used: ${JSON.stringify(languages, null, 2)}
Open Issues Count: ${issues.length}

Sample Issues (first 10):
${issues.slice(0, 10).map((i, idx) => `${idx + 1}. ${i.title} (${i.state})`).join('\n')}

Please analyze this repository and provide:
1. **Code Health Score** (0-100) with explanation
2. **Top 5 Issues** - potential problems or areas needing attention
3. **5 Actionable Recommendations** - specific improvements for the team
4. **Estimated Metrics** - reasonable estimates based on the data

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just pure JSON):

{
  "codeHealth": {
    "score": 85,
    "summary": "Overall healthy codebase with good community engagement. Some areas need attention."
  },
  "issues": [
    {
      "type": "Documentation",
      "severity": "medium",
      "file": "general",
      "message": "Issue description here",
      "suggestion": "How to fix it"
    }
  ],
  "recommendations": [
    {
      "category": "testing",
      "priority": "high",
      "title": "Recommendation title",
      "description": "Detailed description",
      "impact": "Expected positive outcome"
    }
  ],
  "metrics": {
    "linesOfCode": 50000,
    "filesCount": 500,
    "avgComplexity": 7,
    "dependencies": 30
  }
}

Respond with ONLY the JSON object, nothing else.`;

  let responseText = '';

  try {
    if (AI_PROVIDER === 'gemini') {
      responseText = await analyzeWithGemini(prompt);
    } else if (AI_PROVIDER === 'groq') {
      responseText = await analyzeWithGroq(prompt);
    } else {
      throw new Error('No AI provider configured. Please set GEMINI_API_KEY or GROQ_API_KEY');
    }

    // Clean up response - remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to find JSON in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText);
      throw new Error('Invalid AI response format');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response has required fields
    if (!parsed.codeHealth || !parsed.issues || !parsed.recommendations || !parsed.metrics) {
      throw new Error('Missing required fields in AI response');
    }

    return parsed as CodeAnalysisResult;
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Response text:', responseText);
    
    // Return a fallback response for development
    return {
      codeHealth: {
        score: 75,
        summary: 'Analysis completed with basic metrics. Repository appears to be active and maintained.',
      },
      issues: [
        {
          type: 'General',
          severity: 'low',
          file: 'general',
          message: 'AI analysis encountered an issue. Manual review recommended.',
          suggestion: 'Review the repository manually for specific issues.',
        },
      ],
      recommendations: [
        {
          category: 'general',
          priority: 'medium',
          title: 'Improve documentation',
          description: 'Consider adding more comprehensive documentation for better maintainability.',
          impact: 'Improved developer onboarding and code understanding',
        },
      ],
      metrics: {
        linesOfCode: repoInfo.size * 100 || 10000,
        filesCount: 100,
        avgComplexity: 5,
        dependencies: 20,
      },
    };
  }
}