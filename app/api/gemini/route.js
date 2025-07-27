import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function getSpotifyAccessToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    return true;
  } catch (error) {
    console.error('Something went wrong when retrieving an access token', error);
    return false;
  }
}

export async function POST(req) {
  try {
    if (!process.env.GEMINI_API_KEY || !process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error("API keys are not configured on the server.");
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const spotifyAuthenticated = await getSpotifyAccessToken();
    if (!spotifyAuthenticated) {
        throw new Error("Failed to authenticate with Spotify.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const geminiPrompt = `Based on the following prompt, provide a list of 5 relevant songs, artists, or albums. Each item should be on a new line. Prompt: "${prompt}"`;
    const result = await model.generateContent(geminiPrompt);
    const response = await result.response;
    const text = response.text();
    const items = text.split('\n').filter(item => item.trim() !== '');

    const spotifyResults = [];
    for (const item of items) {
        const searchResult = await spotifyApi.searchTracks(item, { limit: 1 });
        if (searchResult.body.tracks.items.length > 0) {
            const track = searchResult.body.tracks.items[0];
            spotifyResults.push({
                name: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                imageUrl: track.album.images[0]?.url,
                url: track.external_urls.spotify,
                uri: track.uri,
            });
        }
    }

    // *** KEY CHANGE HERE ***
    // Instead of sending formatted HTML, send the raw JSON data.
    return NextResponse.json({ results: spotifyResults });

  } catch (error) {
    console.error("!!! CRITICAL ERROR in /api/gemini:", error);
    return NextResponse.json(
      { error: error.message || "An unknown server error occurred." },
      { status: 500 }
    );
  }
}