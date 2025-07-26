import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  console.log("API route /api/gemini hit."); // Log that the route was accessed

  try {
    // 1. Check for API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined.");
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    console.log("API Key found.");

    // 2. Get Prompt
    const { prompt } = await req.json();
    if (!prompt) {
      console.error("No prompt provided in the request.");
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    console.log("Prompt received:", prompt);

    // 3. Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Generating content from Gemini...");
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received.");

    // 4. Send Success Response
    return NextResponse.json({ text });

  } catch (error) {
    // This is the most important log
    console.error("!!! CRITICAL ERROR in /api/gemini:", error);
    
    // Send back a structured error message
    return NextResponse.json(
      { error: error.message || "An unknown server error occurred." },
      { status: 500 }
    );
  }
}