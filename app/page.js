'use client';

import { useState } from 'react';
import styles from './page.module.css';

// We can define the Song component right here or in a separate file
function Song({ name, artist, album, imageUrl, url, uri }) {
  const trackId = uri.split(':')[2];
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#282828', padding: '15px', borderRadius: '8px' }}>
      {imageUrl && <img src={imageUrl} alt={album} style={{ width: '100px', height: '100px', marginRight: '20px', borderRadius: '4px' }} />}
      <div>
        <div style={{ fontWeight: 'bold' }}>{name}</div>
        <div>by {artist}</div>
        <div style={{ fontSize: '0.9em', color: '#b3b3b3' }}>Album: {album}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#1DB954', textDecoration: 'none' }}>Listen on Spotify</a>
        <iframe
          src={embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="encrypted-media"
          style={{ marginTop: '10px' }}
        ></iframe>
      </div>
    </div>
  );
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  // This state will hold the ARRAY of song results
  const [songResults, setSongResults] = useState([]);
  // This state will hold any error messages
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prompt.trim() === '') return;

    setLoading(true);
    setSongResults([]); // Clear previous results
    setError(''); // Clear previous errors

    try {
      const apiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      setSongResults(data.results);

    } catch (err) {
      console.error("Failed to fetch from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Music Recommendation AI</h1>
      <p className={styles.description}>
        Enter a prompt to get a list of songs from Spotify.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'upbeat workout songs'"
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Thinking...' : 'Generate'}
        </button>
      </form>

      {loading && <p>Loading...</p>}
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* *** KEY CHANGE HERE *** */}
      {/* We map over the array of results and render a component for each song */}
      <div className={styles.responseContainer}>
        {songResults.map((song) => (
          <Song
            key={song.uri} // The key is crucial for React to not re-render unnecessarily
            name={song.name}
            artist={song.artist}
            album={song.album}
            imageUrl={song.imageUrl}
            url={song.url}
            uri={song.uri}
          />
        ))}
      </div>
    </main>
  );
}