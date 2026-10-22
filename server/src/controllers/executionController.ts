import { type Response } from 'express';
import { type AuthRequest } from '../middleware/authMiddleware.js';

export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language, stdin } = req.body;

    if (typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: 'No code provided' });
      return;
    }

    if (stdin !== undefined && typeof stdin !== 'string') {
      res.status(400).json({ error: 'stdin must be a string' });
      return;
    }

    // Standardize language names and map versions for the Piston API
    const langConfig: Record<string, string> = {
      javascript: '18.15.0',
      python: '3.10.0',
      cpp: '10.2.0',
      c: '10.2.0',
      java: '15.0.2'
    };

    const targetLang = language.toLowerCase() === 'node' ? 'javascript' : language.toLowerCase();
    const version = langConfig[targetLang] || '*';

    // Send code to the remote execution engine to bypass Render's Docker restriction
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: targetLang,
        version: version,
        files: [{ content: code }],
        stdin: stdin || '',
      }),
    });

    const data = await response.json();

    if (data.message) {
      res.status(400).json({ error: data.message });
      return;
    }

    // Return the executed output back to your frontend
    res.json({ output: data.run.output });

  } catch (error) {
    console.error('Execution Error:', error);
    res.status(500).json({ error: 'Failed to execute code. Execution engine unavailable.' });
  }
};