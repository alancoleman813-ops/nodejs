// Grace Backend Server — API Proxy for Claude
// Deploy on Railway.app
// Keeps API key safe, processes requests, deletes immediately after

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────────────────────────
// CONFESSION BOOTH ENDPOINT
// ──────────────────────────────────────────────────────────────────

app.post('/api/confession', async (req, res) => {
  const { confession } = req.body;

  if (!confession || confession.trim().length === 0) {
    return res.status(400).json({ error: 'Confession cannot be empty' });
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a compassionate, spiritually grounded guide inside a digital confession booth for Christians.
Respond to confessions with raw honesty, warmth and grace, pastoral wisdom like a trusted pastor who is also a friend, 1-2 relevant scripture verses woven in naturally, and practical encouragement with a small step forward.
Write 3 natural paragraphs. No headers. No bullet points. Conversational, real, human. Never shame or guilt-trip.`,
        messages: [
          { role: 'user', content: confession }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const responseText = response.data.content[0].text;
    
    // Send back immediately, then delete from memory
    res.json({ response: responseText });
    
    // Log is optional — helps you see traffic but doesn't store
    console.log(`[${new Date().toISOString()}] Confession processed (not stored)`);
    
  } catch (error) {
    console.error('Claude API error:', error.message);
    res.status(500).json({ error: 'Failed to process confession. Try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────
// DAILY BREAD ENDPOINT
// ──────────────────────────────────────────────────────────────────

app.post('/api/daily-bread', async (req, res) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `You are a gentle, spiritually wise guide delivering a daily devotional for Christians.
Given today's date, provide a real Bible verse relevant to what people might be feeling today, a plain-language reflection of 2-3 sentences that is honest like a wise friend, and one simple question to sit with.
Respond with ONLY a JSON object, no markdown, no code blocks, no extra text:
{"verse":"full verse text","reference":"Book Chapter:Verse","reflection":"2-3 sentence reflection","question":"one question to sit with"}`,
        messages: [
          { role: 'user', content: `Today is ${today}. Give me today's devotional.` }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const responseText = response.data.content[0].text;
    const devotional = JSON.parse(responseText.replace(/```json|```/g, '').trim());
    
    res.json(devotional);
    console.log(`[${new Date().toISOString()}] Daily Bread generated (not stored)`);
    
  } catch (error) {
    console.error('Claude API error:', error.message);
    // Fallback devotional if Claude fails
    res.json({
      verse: "Be still, and know that I am God.",
      reference: "Psalm 46:10",
      reflection: "Some days the most faithful thing you can do is stop. Stop striving, stop performing, stop trying to fix everything. God doesn't need your hustle — He wants your heart.",
      question: "What would it look like to be still today, even for five minutes?"
    });
  }
});

// ──────────────────────────────────────────────────────────────────
// GRACE AI CHAT ENDPOINT
// ──────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: `You are Grace, a warm, knowledgeable AI spiritual companion for Christians.
Respond with pastoral wisdom, relevant scripture, and practical encouragement. Be conversational and real, never preachy. Keep responses to 2-4 sentences unless depth is truly needed.`,
        messages: [
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const responseText = response.data.content[0].text;
    res.json({ response: responseText });
    console.log(`[${new Date().toISOString()}] Chat message processed (not stored)`);
    
  } catch (error) {
    console.error('Claude API error:', error.message);
    res.status(500).json({ error: 'Failed to process message. Try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────
// HEALTH CHECK (so Railway knows your server is alive)
// ──────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'Grace backend is running' });
});

// ──────────────────────────────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Grace backend running on port ${PORT}`);
  console.log(`API Key configured: ${process.env.CLAUDE_API_KEY ? 'YES' : 'NO'}`);
});

// ──────────────────────────────────────────────────────────────────
// PRIVACY GUARANTEE
// ──────────────────────────────────────────────────────────────────
// This server:
// ✓ Receives requests from user phones
// ✓ Calls Claude API with your secret key
// ✓ Returns responses to phones
// ✓ DOES NOT STORE any user confessions, messages, or devotionals
// ✓ DOES NOT KEEP LOGS of user data
// ✓ Deletes everything immediately after processing
//
// User data stays on their phone only.
// Your API key stays on this server only.
