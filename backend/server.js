import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ ERROR: Missing OPENAI_API_KEY in .env file");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory DB
const usersDB = [{ id: 1, name: "Demo Student", email: "student@example.com", password: "pass123" }];
const chatsDB = {}; // { userId: [{id, title, messages: []}] }
const booksDB = [];

// Helper to chunk book text
function chunkText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
  return chunks;
}

// Test route
app.get('/test', (req, res) => {
  res.json({ message: '✅ Backend is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});


// ====== Create new chat ======
app.post('/chats/:userId/new', (req, res) => {
  const { userId } = req.params;
  if (!chatsDB[userId]) chatsDB[userId] = [];
  const newChat = {
    id: Date.now().toString(),
    title: `Chat ${chatsDB[userId].length + 1}`,
    messages: []
  };
  chatsDB[userId].push(newChat);
  res.json(newChat);
});

// ====== Get chats ======
app.get('/chats/:userId', (req, res) => {
  const { userId } = req.params;
  res.json(chatsDB[userId] || []);
});

// ====== Send message ======
app.post('/chats/:userId/:chatId/message', async (req, res) => {
  const { userId, chatId } = req.params;
  const { role, content } = req.body;

  if (!chatsDB[userId]) return res.status(404).json({ error: "User chats not found" });
  const chat = chatsDB[userId].find(c => c.id === chatId);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  const message = { role, content, timestamp: new Date().toISOString() };
  chat.messages.push(message);

  if (role === "user") {
    console.log(`📩 User message received: "${content}"`);

    // Find relevant book chunks
    const questionWords = content.toLowerCase().split(/\s+/);
    let bestChunks = [];
    booksDB.forEach(book => {
      book.chunks.forEach((chunk) => {
        let score = 0;
        questionWords.forEach(word => { if (chunk.toLowerCase().includes(word)) score++; });
        if (score > 0) bestChunks.push({ text: chunk, score });
      });
    });

    bestChunks.sort((a, b) => b.score - a.score);
    const contextText = bestChunks.slice(0, 3).map(c => c.text).join("\n---\n");

    const messagesForAI = [
      { role: 'system', content: "You are a patient mentor AI assistant. Use the study material below to answer questions, otherwise answer from your knowledge." }
    ];
    if (contextText) {
      messagesForAI.push({ role: 'system', content: `📚 Study Material:\n${contextText}` });
    }

    // Include last 5 messages for context
    const lastMessages = chat.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-5)
      .map(m => ({ role: m.role, content: m.content }));

    messagesForAI.push(...lastMessages);
    messagesForAI.push({ role: 'user', content });

    try {
      console.log("🤖 Sending to OpenAI API...");
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messagesForAI,
      });

      const aiAnswer = completion.choices[0]?.message?.content || "Sorry, I couldn't generate an answer.";
      console.log("✅ AI replied:", aiAnswer);

      const aiMessage = { role: 'assistant', content: aiAnswer, timestamp: new Date().toISOString() };
      chat.messages.push(aiMessage);

      res.json({ answer: aiAnswer, chat });
    } catch (err) {
      console.error("❌ OpenAI API error:", err);
      res.status(500).json({ error: "AI generation failed", details: err.message });
    }
  } else {
    res.json({ chat });
  }
});

// ====== Upload books ======
app.post('/upload', upload.single('book'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { path: filePath, originalname } = req.file;
    let textContent = '';

    if (originalname.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;
    } else if (originalname.toLowerCase().endsWith('.txt')) {
      textContent = fs.readFileSync(filePath, 'utf-8');
    } else return res.status(400).json({ error: 'Unsupported file format' });

    const chunks = chunkText(textContent);
    booksDB.push({ id: booksDB.length + 1, filename: originalname, chunks });

    fs.unlinkSync(filePath);
    console.log(`📚 Book uploaded: ${originalname} with ${chunks.length} chunks`);
    res.json({ message: 'File uploaded and processed successfully' });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
