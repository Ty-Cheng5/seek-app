// File Path: app/api/suggestions/route.js

import { NextResponse } from 'next/server';

// This function handles POST requests to /api/suggestions
export async function POST(request) {
  // Get the user's prompt from the request body
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // --- Securely get API Keys from Environment Variables ---
  const geminiKey = process.env.GEMINI_API_KEY;
  const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
  const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!geminiKey || !spotifyClientId || !spotifyClientSecret) {
    return NextResponse.json({ error: 'API keys are not configured on the server.' }, { status: 500 });
  }

  try {
    // --- Step 1: Get Spotify Access Token (Server-side) ---
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString('base64'),
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenResponse.json();
    const spotifyToken = tokenData.access_token;


    // --- Step 2: Call Gemini API to get song ideas (Server-side) ---
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
    const geminiPrompt = `Based on the user input "${prompt}", suggest 5 real songs. Give ONLY the song title and artist. Format as a JSON array of strings, for example: ["Bohemian Rhapsody by Queen", "Stairway to Heaven by Led Zeppelin"]`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: geminiPrompt }] }] }),
    });
    const geminiData = await geminiResponse.json();
    const songTitlesText = geminiData.candidates[0].content.parts[0].text;
    const songTitles = JSON.parse(songTitlesText.replace(/```json|```/g, '').trim());


    // --- Step 3: Search Spotify for each song and get track IDs (Server-side) ---
    const trackIds = [];
    for (const title of songTitles) {
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(title)}&type=track&limit=1`;
      const spotifyResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${spotifyToken}` },
      });
      const spotifyData = await spotifyResponse.json();
      if (spotifyData.tracks && spotifyData.tracks.items.length > 0) {
        trackIds.push(spotifyData.tracks.items[0].id);
      }
    }

    // --- Step 4: Send the final, safe list of track IDs back to the frontend ---
    return NextResponse.json({ trackIds });

  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}