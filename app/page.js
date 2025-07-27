'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const generateResponse = async (e) => {
    e.preventDefault();
    setResponse('');
    setLoading(true);

    try {
      const apiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      setResponse(data.text);

    } catch (error) {
      console.error("Failed to fetch from API", error);
      // You can also set an error state here to display to the user
      setResponse('<p>Sorry, something went wrong. Please try again.</p>');
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

      <form onSubmit={generateResponse} className={styles.form}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'sad songs for a rainy day'"
          className={styles.input}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Thinking...' : 'Generate'}
        </button>
      </form>

      {/* --- This is the main change --- */}
      {response && (
        <div 
          className={styles.responseContainer}
          dangerouslySetInnerHTML={{ __html: response }} 
        />
      )}

      {loading && <p>Loading...</p>}
    </main>
  );
}