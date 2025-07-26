import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// This function handles POST requests made to /api/gemini
export async function POST(req) {
  try {
    // Check if the API key is available on the server
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the successful response back as JSON
    return NextResponse.json({ text });

  } catch (error) {
    // Log the error on the server for debugging
    console.error("Error in /api/gemini:", error);
    
    // Send a structured JSON error back to the frontend
    return NextResponse.json(
      { error: error.message || "An internal server error occurred." },
      { status: 500 }
    );
  }
}