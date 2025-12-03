import Papa from 'papaparse';
import type {
  AuthResponse,
  MessageResponse,
  SheetsResponse,
  Message,
  User,
  SheetRow
} from '../types/api';

const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

// n8n Webhook URLs
const N8N_WEBHOOK_URLS = {
  invoice: import.meta.env.VITE_N8N_INVOICE_WEBHOOK_URL || '',
  kdr: import.meta.env.VITE_N8N_KDR_WEBHOOK_URL || '',
  ga: import.meta.env.VITE_N8N_GA_WEBHOOK_URL || '',
  'kdr invoicing': import.meta.env.VITE_N8N_KDR_INVOICING_WEBHOOK_URL || '',
};

class ApiService {
  // Parse CSV data from Google Sheets
  private async fetchSheetData(): Promise<SheetRow[]> {
    if (!GOOGLE_SHEET_URL) {
      throw new Error('Google Sheets URL not configured');
    }

    const response = await fetch(GOOGLE_SHEET_URL, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty response from Google Sheets');
    }

    // Parse CSV using papaparse
    const parsed = Papa.parse<SheetRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      transform: (value) => value.trim(),
    });

    if (parsed.errors.length > 0) {
      console.warn('CSV parsing errors:', parsed.errors);
    }

    return parsed.data;
  }

  // Authentication
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const rows = await this.fetchSheetData();

      if (rows.length === 0) {
        return {
          success: false,
          error: 'No users found'
        };
      }

      // Find matching user
      const matchedRow = rows.find(
        row => row.username?.toLowerCase() === username.toLowerCase() &&
               row.password === password
      );

      if (!matchedRow) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Parse modules from comma-separated string to array
      let modules: string[] = [];
      if (matchedRow.modules) {
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
      const user: User = {
        id: matchedRow.id || '',
        username: matchedRow.username,
        modules: modules,
        role: matchedRow.role,
        email: matchedRow.email,
      };

      const rnd = cryptoRandomToken();
      return {
        success: true,
        user: user,
        token: rnd
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Google Sheets Data
  async getSheetData(): Promise<SheetsResponse> {
    try {
      const data = await this.fetchSheetData();

      return {
        data,
        timestamp: new Date().toISOString(),
        rowCount: data.length
      };
    } catch (error) {
      console.error('Error fetching sheet:', error);
      throw error;
    }
  }

  // Messages - Send to n8n webhooks
  async sendMessage(
    text: string,
    sender: 'user' | 'bot',
    category?: 'invoice' | 'kdr' | 'ga' | 'kdr invoicing',
    userId?: string
  ): Promise<MessageResponse> {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text,
      sender,
      timestamp: new Date().toISOString(),
      category,
      userId
    };

    // Send to n8n webhook if category is provided
    if (category && N8N_WEBHOOK_URLS[category]) {
      try {
        const webhookUrl = N8N_WEBHOOK_URLS[category];

        // Get username from userId or use 'unknown'
        const username = userId || 'unknown';

        // Send POST request to n8n webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            sender,
            category,
            userId,
            username,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          console.error(`n8n webhook error: ${response.status} ${response.statusText}`);
          throw new Error(`Webhook request failed: ${response.status}`);
        }

        // Parse the response from n8n
        const n8nResponse = await response.json();

        // Extract bot response from n8n if available
        let botResponseText = 'Message sent to processing workflow. You will receive a response shortly.';

        if (n8nResponse.message || n8nResponse.response || n8nResponse.reply) {
          botResponseText = n8nResponse.message || n8nResponse.response || n8nResponse.reply;
        }

        const botResponse: Message = {
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          category,
          userId
        };

        return {
          success: true,
          message,
          botResponse
        };
      } catch (error) {
        console.error('Error sending to n8n webhook:', error);

        // Return error response
        const botResponse: Message = {
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text: 'Sorry, there was an error processing your message. Please try again.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          category,
          userId
        };

        return {
          success: false,
          message,
          botResponse,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Fallback response if no category or webhook URL
    const botResponse: Message = {
      id: `bot_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      text: 'Message received. Processing module not configured.',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      category,
      userId
    };

    return {
      success: true,
      message,
      botResponse
    };
  }

  async getMessages(
    _category?: string,
    _userId?: string
  ): Promise<MessageResponse> {
    // For now, return empty messages
    return {
      success: true,
      messages: []
    };
  }
}

export const apiService = new ApiService();

function cryptoRandomToken(): string {
  const arr = new Uint8Array(24);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
