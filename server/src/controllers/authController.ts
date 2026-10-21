// server/src/controllers/authController.ts
import { type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import pool from '../config/db.js';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert the new user into PostgreSQL
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );

    // 4. Generate JWT
    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const accessToken: unknown = req.body?.accessToken;
  if (typeof accessToken !== 'string' || !accessToken) {
    res.status(400).json({ error: 'A Supabase access token is required' });
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    const supabaseUser = data.user;
    const providers = supabaseUser?.app_metadata.providers;
    const isGoogleUser =
      supabaseUser?.app_metadata.provider === 'google' ||
      (Array.isArray(providers) && providers.includes('google'));
    const email = supabaseUser?.email?.trim().toLowerCase();

    if (error || !supabaseUser || !email || !supabaseUser.email_confirmed_at || !isGoogleUser) {
      res.status(401).json({ error: 'Google authentication could not be verified' });
      return;
    }

    const existingUser = await pool.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );

    let user = existingUser.rows[0];
    if (!user) {
      const metadata = supabaseUser.user_metadata;
      const candidateName = metadata.full_name ?? metadata.name;
      const name =
        typeof candidateName === 'string' && candidateName.trim()
          ? candidateName.trim()
          : email.split('@')[0];
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);

      const insertedUser = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, name, email`,
        [name, email, passwordHash]
      );
      user = insertedUser.rows[0];

      if (!user) {
        const concurrentUser = await pool.query(
          'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
          [email]
        );
        user = concurrentUser.rows[0];
      }
    }

    if (!user) {
      throw new Error('Could not find or create a local user for the Google account');
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ error: 'Server error during Google login' });
  }
};