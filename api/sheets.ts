import type { VercelRequest, VercelResponse } from '@vercel/node';
import Papa from 'papaparse';

interface SheetRow {
  [key: string]: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      console.error('GOOGLE_SHEET_URL environment variable is not set');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Google Sheets URL not configured'
      });
    }

    console.log('Fetching Google Sheet from:', sheetUrl);

    const response = await fetch(sheetUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      console.warn('Empty CSV response from Google Sheets');
      return res.status(200).json({ data: [], timestamp: new Date().toISOString(), rowCount: 0 });
    }

    // Parse CSV using papaparse for robust handling
    const parsed = Papa.parse<SheetRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
      // Continue anyway if we have some data
    }

    const data = parsed.data;

    console.log(`Successfully parsed ${data.length} rows from Google Sheets`);

    return res.status(200).json({
      data,
      timestamp: new Date().toISOString(),
      rowCount: data.length
    });

  } catch (error) {
    console.error('Error fetching sheet:', error);
    return res.status(500).json({
      error: 'Failed to fetch data from Google Sheets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
