'use client';

import { useState } from 'react';

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json(); // Try to parse the response as JSON

      if (!res.ok) {
        // If the server returned an error (like 400 or 500), use its error message
        throw new Error(data.error || 'API request failed.');
      }

      setResponse(data.text);

    } catch (err) {
      // This will now catch the "Unexpected token '<'" error if the path is wrong,
      // or the specific error from our API if the path is correct but something else fails.
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Gemini AI Prompt</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows="5"
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      {response && (
        <div className="response-container">
          <h2>Response:</h2>
          <pre>{response}</pre>
        </div>
      )}
    </main>
  );
}