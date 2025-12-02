import type { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

interface User {
  id: string;
  username: string;
  password: string;
  modules: string[];
  role?: string;
  email?: string;
}

interface SheetRow {
  id: string;
  username: string;
  password: string;
  modules: string;
  [key: string]: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Fetch users from Google Sheets
    const sheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      console.error('GOOGLE_SHEET_URL environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    console.log('Fetching users from Google Sheet...');

    const response = await fetch(sheetUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      console.error('Empty CSV response from Google Sheets');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Parse CSV using papaparse
    const parsed = Papa.parse<SheetRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
    }

    const rows = parsed.data;

    if (rows.length === 0) {
      console.error('No users found in Google Sheets');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Find matching user
    const matchedRow = rows.find(
      row => row.username?.toLowerCase() === username.toLowerCase() &&
             row.password === password
    );

    if (!matchedRow) {
      console.log(`Authentication failed for user: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Parse modules from comma-separated string to array
    let modules: string[] = [];
    if (matchedRow.modules) {
      // Handle both comma-separated values and JSON arrays
      try {
        // Try parsing as JSON array first
        modules = JSON.parse(matchedRow.modules);
      } catch {
        // Fall back to comma-separated values
        modules = matchedRow.modules
          .split(',')
          .map(m => m.trim().toLowerCase())
          .filter(m => m.length > 0);
      }
    }

    // Construct user object without password
    const user: Omit<User, 'password'> = {
      id: matchedRow.id || '',
      username: matchedRow.username,
      modules: modules,
      role: matchedRow.role,
      email: matchedRow.email,
    };

    console.log(`User ${username} authenticated successfully with modules:`, modules);

    return res.status(200).json({
      success: true,
      user: user,
      token: Buffer.from(`${username}:${Date.now()}`).toString('base64')
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
