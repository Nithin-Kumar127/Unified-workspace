import {type Response } from 'express';
import {type AuthRequest } from '../middleware/authMiddleware.js'; // Assuming your auth middleware is here
import { executeCode } from '../services/dockerServices.js';

export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;

    if (!code) {
      res.status(400).json({ error: 'No code provided' });
      return;
    }

    const output = await executeCode(code, language);
    res.json({ output });
  } catch (error) {
    console.error('Execution Error:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
};