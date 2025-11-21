import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Question, QuestionType, FileAttachment } from "../types";

// Define the schema for the response
const questionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: [
          QuestionType.MCQ,
          QuestionType.TRUE_FALSE,
          QuestionType.MULTI_SELECT,
          QuestionType.FILL_BLANK,
        ],
        description: "The type of the question.",
      },
      questionText: {
        type: Type.STRING,
        description: "The actual question prompt.",
      },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of options for MCQ/Multi. Empty for Fill-blank/TF.",
      },
      correctAnswers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of correct answer strings.",
      },
      explanation: {
        type: Type.STRING,
        description: "A short explanation of why the answer is correct.",
      },
      difficulty: {
        type: Type.STRING,
        enum: ["easy", "medium", "hard"],
        description: "The difficulty level of the question.",
      },
    },
    required: ["type", "questionText", "correctAnswers", "explanation", "difficulty"],
  },
};

export const generateFlashcards = async (
  textContext: string,
  attachments: FileAttachment[],
  subjectName: string,
  topicName: string
): Promise<Question[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY not found in environment variables");
    }

    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];
    
    // Add text context (includes user text + extracted text from Docs/Slides)
    let promptText = `You are an expert tutor creating a gamified study set.
    Subject: "${subjectName}"
    Topic: "${topicName}"
    
    Analyze the provided content (text and documents) to determine the user's education level (High School vs University). 
    - If the content is advanced (theoretical, complex jargon), generate University-level critical thinking questions.
    - If the content is foundational, generate High School level application questions.
    
    Text Content:\n${textContext}`;

    parts.push({
      text: promptText,
    });

    // Add attachments (Images and PDFs)
    // PDF is supported via 'application/pdf' mimeType in inlineData
    attachments.forEach((att) => {
      // Remove header if present (e.g., "data:image/png;base64,")
      const cleanBase64 = att.data.split(",")[1] || att.data;
      
      // Ensure valid mime types for Gemini
      const validMime = att.mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg'; // Default images to jpeg if unsure, but usually passed correctly

      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: att.mimeType, 
        },
      });
    });

    parts.push({
      text: `Generate 8 diverse, fun, and challenging flashcard questions.
      
      Requirements:
      1. Mix Question Types:
         - Multiple Choice (MCQ): 4 options, 1 correct.
         - True/False: Clear boolean statements.
         - Multiple Select: 4 options, 2-3 correct.
         - Fill in the Blank: The answer must be a specific keyword from the text (1-2 words max).
      
      2. Style:
         - Make questions engaging, not robotic.
         - "Explanation" should be helpful and encouraging.
      
      3. Output must be a valid JSON array matching the schema.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from Gemini");
    
    const questionsRaw = JSON.parse(jsonText) as Partial<Question>[];
    
    // Post-process to ensure IDs and structure
    return questionsRaw.map((q, index) => ({
      id: `gen-${Date.now()}-${index}`,
      type: q.type || QuestionType.MCQ,
      questionText: q.questionText || "Error parsing question",
      options: q.options || [],
      correctAnswers: q.correctAnswers || [],
      explanation: q.explanation || "No explanation provided.",
      difficulty: q.difficulty || 'medium'
    }));

  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};