import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import SpotifyWebApi from 'spotify-web-api-node';

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

// Function to get a Spotify Access Token
async function getSpotifyAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    console.log('The access token is ' + data.body['access_token']);
    spotifyApi.setAccessToken(data.body['access_token']);
    return true;
  } catch (error) {
    console.error('Something went wrong when retrieving an access token', error);
    return false;
  }
}

export async function POST(req) {
  console.log("API route /api/gemini hit.");

  try {
    // 1. Check for API Keys
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }

    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not configured.");
    }
    console.log("API Keys found.");

    // 2. Get Prompt
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }
    console.log("Prompt received:", prompt);

    // 3. Get Spotify Access Token
    const spotifyAuthenticated = await getSpotifyAccessToken();
    if (!spotifyAuthenticated) {
        throw new Error("Failed to authenticate with Spotify.");
    }

    // 4. Call Gemini API to get a list of items
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Generating content from Gemini...");
    
    const geminiPrompt = `Based on the following prompt, provide a list of 5 relevant songs, artists, or albums. Each item should be on a new line. Prompt: "${prompt}"`;
    const result = await model.generateContent(geminiPrompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received:", text);

    const items = text.split('\n').filter(item => item.trim() !== '');

    // 5. Search for each item on Spotify
    const spotifyResults = [];
    for (const item of items) {
        const searchResult = await spotifyApi.searchTracks(item, { limit: 1 });
        if (searchResult.body.tracks.items.length > 0) {
            const track = searchResult.body.tracks.items[0];
            spotifyResults.push({
                name: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                imageUrl: track.album.images[0]?.url, // Get the first album image
                url: track.external_urls.spotify,
                uri: track.uri, // Spotify URI for embedding
            });
        }
    }

    // 6. Format the final response with embedded song information
    let formattedResponse = "Here are some songs related to your prompt:\n\n";
    spotifyResults.forEach(item => {
        // Using Markdown for easy rendering on the frontend
        formattedResponse += `
<div style="display: flex; align-items: center; margin-bottom: 20px;">
  <img src="${item.imageUrl}" alt="${item.album}" style="width: 100px; height: 100px; margin-right: 20px;">
  <div>
    <strong>${item.name}</strong> by ${item.artist}<br>
    Album: ${item.album}<br>
    <a href="${item.url}" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>
    <br>
    <iframe src="https://open.spotify.com/embed/track/${item.uri.split(':')[2]}" width="300" height="80" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>
  </div>
</div>
`;
    });

    // 7. Send Success Response
    return NextResponse.json({ text: formattedResponse });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in /api/gemini:", error);
    
    return NextResponse.json(
      { error: error.message || "An unknown server error occurred." },
      { status: 500 }
    );
  }
}