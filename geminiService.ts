import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";

export interface MultimodalPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) GeminiService.instance = new GeminiService();
    return GeminiService.instance;
  }

  private getClient(): GoogleGenAI {
    const key = process.env.API_KEY;
    if (!key || key === 'undefined') {
      throw new Error("API_KEY_MISSING: The laboratory requires an API Key for uplink. Please check your GitHub Secrets or environment configuration.");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  public async *sendMessageStream(
    message: string, 
    history: any[] = [], 
    image?: { data: string; mimeType: string },
    overrideInstruction?: string
  ) {
    const ai = this.getClient();
    
    const systemInstruction = overrideInstruction || `You are the KSHITIZ CODERS Neural Coding Core.
        Owner: Kshitiz Mishra.
        Mission: Elite Polyglot Software Engineering, Code Synthesis, and Security Auditing.
        
        CORE CAPABILITIES:
        1. POLYGLOT MASTERY: You understand every programming language (Assembly, Rust, C++, Zig, TypeScript, Python, Haskell, Solidity, COBOL, etc.).
        2. LOGIC SYNTHESIS: Generate clean, production-ready, and optimized code. Explain architectural decisions.
        3. SECURITY AUDITING: Automatically scan for vulnerabilities (Buffer overflows, SQLi, XSS, Reentrancy) in every code snippet you generate or analyze.
        4. PERFORMANCE OPTIMIZATION: Suggest O(n) improvements, memory layout optimizations, and concurrency patterns.
        
        STYLE: Professional, technical, highly detailed. 
        IDENTITY: State "I am the KSHITIZ CODERS Polyglot Software Engineering Core."
        TOOLS: Use Google Search to verify latest documentation, library updates, or security advisories.`;

    // High-performance model selection for complex coding tasks
    const modelName = 'gemini-3-pro-preview';

    if (image) {
      const parts = [
        { text: message },
        { inlineData: { data: image.data, mimeType: image.mimeType } }
      ];

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents: { parts },
        config: { systemInstruction }
      });

      for await (const chunk of response) {
        yield { text: chunk.text || '', grounding: [] };
      }
      return;
    }

    const chat: Chat = ai.chats.create({
      model: modelName,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 16000 } // Enable thinking for complex logic
      },
      history: history.length > 0 ? history : []
    });

    try {
      const stream = await chat.sendMessageStream({ message });
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const grounding = c.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
          title: chunk.web?.title || 'Engineering Reference',
          uri: chunk.web?.uri || ''
        })).filter(item => item.uri) || [];
        yield { text: c.text || '', grounding };
      }
    } catch (error: any) {
      console.error("Neural Core Error:", error);
      throw new Error(error.message || "Neural Coding Core uplink failed.");
    }
  }

  public async evolveLaboratory(demand: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `User demand for Neural Coding Core: "${demand}". 
      Translate this into a specific Coding Protocol. 
      Example: If user asks for "Rust Expert", the protocol should enforce strict memory safety checks.
      Return strictly JSON with title, desc, systemInstruction, and iconName.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            desc: { type: Type.STRING },
            systemInstruction: { type: Type.STRING },
            iconName: { type: Type.STRING }
          },
          required: ['title', 'desc', 'systemInstruction', 'iconName']
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      throw new Error("Logic Synthesis Failed.");
    }
  }

  public async generateEngineeringReport(content: string) {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a deep static analysis and security audit on this logic: "${content}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vulnerabilitiesFound: { type: Type.INTEGER },
            linesAnalyzed: { type: Type.INTEGER },
            complexityScore: { type: Type.STRING },
            optimizationPotential: { type: Type.INTEGER }
          },
          required: ['vulnerabilitiesFound', 'linesAnalyzed', 'complexityScore', 'optimizationPotential']
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return { vulnerabilitiesFound: 0, linesAnalyzed: 0, complexityScore: 'Low', optimizationPotential: 0 };
    }
  }
}