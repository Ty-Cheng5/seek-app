// Add this at the VERY TOP of the file
"use client";

import { useState } from 'react';

export default function HomePage() {
  // State to hold user input, song results, and loading status
  const [userInput, setUserInput] = useState('');
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSuggestions = async () => {
    if (!userInput) return;

    setIsLoading(true);
    setError(null);
    setSongs([]);

    try {
      // Step 1: Call your OWN secure API endpoint
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions from the server.');
      }

      const data = await response.json();
      setSongs(data.trackIds || []);

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div className="container">
        <h1>AI Song Suggester</h1>
        <p>Describe a mood, genre, or activity, and get some song recommendations!</p>
        
        <div className="search-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g., Upbeat 80s synthwave for driving at night"
            disabled={isLoading}
          />
          <button onClick={getSuggestions} disabled={isLoading}>
            {isLoading ? 'Getting Songs...' : 'Get Suggestions'}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="suggestions-container">
          {songs.map(trackId => (
            <iframe
              key={trackId}
              src={`https://open.spotify.com/embed/track/${trackId}`}
              width="100%"
              height="352"
              allow="encrypted-media"
              loading="lazy"
            ></iframe>
          ))}
        </div>
      </div>
    </main>
  );
}