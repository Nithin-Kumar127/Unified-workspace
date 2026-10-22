import { type Response } from 'express';
import { type AuthRequest } from '../middleware/authMiddleware.js';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, language } = req.body;

    if (typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ error: 'No code provided' });
      return;
    }

    // Restrict to JavaScript since we are running natively on a Node server
    const targetLang = language.toLowerCase();
    if (targetLang !== 'javascript' && targetLang !== 'node') {
      res.status(400).json({ 
        error: 'Execution API restricted. Currently, only JavaScript is supported natively for this demonstration.' 
      });
      return;
    }

    // Create a temporary file in the OS temp directory
    const tmpDir = os.tmpdir();
    const fileName = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}.js`;
    const filePath = path.join(tmpDir, fileName);

    fs.writeFileSync(filePath, code);

    // Execute the temporary file using the server's own Node runtime (5-second timeout)
    exec(`node ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up the temporary file immediately after execution
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (error) {
        if (error.killed) {
          res.json({ output: 'Error: Execution timed out (5-second limit).' });
        } else {
          // Return the actual runtime error (e.g., syntax errors) to the user console
          res.json({ output: stderr || error.message });
        }
        return;
      }

      // Return successful execution output
      res.json({ output: stdout || stderr });
    });

  } catch (error) {
    console.error('Execution Error:', error);
    res.status(500).json({ error: 'Failed to execute code natively on the server.' });
  }
};