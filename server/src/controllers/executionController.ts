import {type Response } from 'express';
import {type AuthRequest } from '../middleware/authMiddleware.js'; // Assuming your auth middleware is here
import { executeCode, ExecutionServiceError } from '../services/dockerServices.js';

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

    const output = await executeCode(code, language, stdin);
    res.json({ output });
  } catch (error) {
    console.error('Execution Error:', error);
    if (error instanceof ExecutionServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to execute code' });
  }
};