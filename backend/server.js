// backend/server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import pdfParse from "pdf-parse";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

/* ---------------- Config ---------------- */
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
if (!HF_API_KEY) {
  console.error("❌ HUGGINGFACE_API_KEY missing in .env");
  process.exit(1);
}
console.log("✅ Hugging Face key detected");

const PORT = process.env.PORT || 5000;
const LLM_MODEL = "gpt2";
const EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const OCR_MODEL = "microsoft/trocr-large-printed";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const KB_FILE = path.join(DATA_DIR, "kb.json");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");

await fs.mkdir(UPLOAD_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const upload = multer({ dest: UPLOAD_DIR });

/* ---------------- Tiny DB ---------------- */
let KB = [];
let CHATS = {};

async function loadDB() {
  try { KB = JSON.parse(await fs.readFile(KB_FILE, "utf8")); } catch (_) { KB = []; }
  try { CHATS = JSON.parse(await fs.readFile(CHATS_FILE, "utf8")); } catch (_) { CHATS = {}; }
}
async function saveKB() { await fs.writeFile(KB_FILE, JSON.stringify(KB, null, 2), "utf8"); }
async function saveChats() { await fs.writeFile(CHATS_FILE, JSON.stringify(CHATS, null, 2), "utf8"); }
await loadDB();

/* ---------------- Utils ---------------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function chunkText(text, size = 700, overlap = 120) {
  const clean = text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size).trim());
    i += size - overlap;
  }
  return chunks.filter(c => c.length > 5);
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return (!na || !nb) ? 0 : dot / (Math.sqrt(na)*Math.sqrt(nb));
}

/* ---------------- Hugging Face ---------------- */
async function embedTexts(texts) {
  const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${EMBED_MODEL}`;
  const { data } = await axios.post(url, texts.length===1? texts[0]: texts, {
    headers: { Authorization: `Bearer ${HF_API_KEY}`, "Content-Type":"application/json" },
    timeout: 60_000
  });
  return Array.isArray(data[0]) ? data : [data];
}

// async function generateText(prompt, opts={}) {
//   const url = `https://api-inference.huggingface.co/models/${LLM_MODEL}`;
//   const body = { inputs: prompt, parameters: { max_new_tokens: opts.max_new_tokens??300, temperature: opts.temperature??0.2, top_p:0.95, return_full_text:false, repetition_penalty:1.05 }};
//   const { data } = await axios.post(url, body, { headers: { Authorization:`Bearer ${HF_API_KEY}`, "Content-Type":"application/json"}, timeout:120_000 });
//   if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text.trim();
//   if (data?.generated_text) return data.generated_text.trim();
//   return "";
// }

async function generateText(prompt, opts = {}) {
  // Dummy response for testing
  return "Hello! This is a test reply.";
}

async function imageToText(buffer, mime="application/octet-stream") {
  const url = `https://api-inference.huggingface.co/models/${OCR_MODEL}`;
  const { data } = await axios.post(url, buffer, { headers:{ Authorization:`Bearer ${HF_API_KEY}`, "Content-Type":mime }, timeout:120_000 });
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text.trim();
  return "";
}

/* ---------------- KB / Retrieval ---------------- */
async function addToKB({ source, fullText }) {
  const chunks = chunkText(fullText);
  if (!chunks.length) return 0;
  const embs = await embedTexts(chunks);
  const items = chunks.map((text,i)=>({ id:uid(), source, text, embedding:embs[i] }));
  KB.push(...items);
  await saveKB();
  return items.length;
}

async function retrieve(query,k=4) {
  if (!KB.length) return [];
  const [qEmb] = await embedTexts([query]);
  const scored = KB.map(item=>({ item, score:cosine(qEmb, item.embedding) }));
  scored.sort((a,b)=>b.score-a.score);
  return scored.slice(0,k).map(s=>s.item);
}

/* ---------------- Chat Helpers ---------------- */
function ensureUser(userId){ if(!CHATS[userId]) CHATS[userId]=[]; }
function createChat(userId){ ensureUser(userId); const id=uid(); const chat={id,title:"New Chat",createdAt:Date.now(),messages:[],answer:""}; CHATS[userId].unshift(chat); return chat; }

/* ---------------- Routes ---------------- */
app.get("/", (req,res)=>res.send("Backend is running ✅"));
app.get("/chats/:userId",(req,res)=>{ ensureUser(req.params.userId); res.json(CHATS[req.params.userId]); });
app.post("/chats/:userId/new", async (req,res)=>{ const chat=createChat(req.params.userId); await saveChats(); res.json(chat); });

app.post("/chats/:userId/:chatId/message", async (req,res)=>{
  try {
    const {userId,chatId}=req.params;
    const {role="user",content}=req.body||{};
    if(!content || role!=="user") return res.status(400).json({error:"Body must be { role: 'user', content: '...' }"});
    ensureUser(userId);
    const chats=CHATS[userId];
    const chat=chats.find(c=>c.id===chatId);
    if(!chat) return res.status(404).json({error:"Chat not found"});
    chat.messages.push({role:"user",content});
    const ctx=await retrieve(content,4);
    const prompt=`You are "My Mentor", a helpful teacher for Indian school students.
Use ONLY the provided context (from NCERT or user uploads) to answer clearly and step-by-step.
If the answer is not in the context, say: "I don't have enough info from the provided books."

## Context:
${ctx.map((c,i)=>`# Source ${i+1} (${c.source})\n${c.text}`).join("\n\n")||"(No context available)"}

## Student question:
${content}

## Answer in a friendly, simple way:`;
    const answer=await generateText(prompt) || "I couldn't generate an answer.";
    chat.messages.push({role:"assistant",content:answer});
    chat.answer=answer;
    if(chat.title==="New Chat" && content.length) chat.title=content.slice(0,40);
    await saveChats();
    res.json({answer,chat});
  } catch(err){ console.error("message error:",err?.response?.data||err.message); res.status(500).json({error:"Failed to generate answer"}); }
});

app.post("/upload", upload.single("book"), async (req,res)=>{
  try {
    if(!req.file) return res.status(400).json({error:"No file uploaded"});
    const filePath=req.file.path;
    const orig=req.file.originalname.toLowerCase();
    let added=0;
    try {
      if(orig.endsWith(".pdf")){
        const buf=await fs.readFile(filePath);
        const parsed=await pdfParse(buf);
        const text=(parsed.text||"").trim();
        if(!text) throw new Error("No text extracted from PDF");
        added=await addToKB({source:orig,fullText:text});
      } else if(orig.endsWith(".txt")){
        const text=(await fs.readFile(filePath,"utf8")).trim();
        if(!text) throw new Error("Empty text file");
        added=await addToKB({source:orig,fullText:text});
      } else if(/\.(png|jpg|jpeg|webp)$/i.test(orig)){
        const buf=await fs.readFile(filePath);
        const ocrText=await imageToText(buf, req.file.mimetype||"application/octet-stream");
        if(!ocrText) throw new Error("OCR failed to extract text");
        added=await addToKB({source:orig,fullText:ocrText});
      } else {
        return res.status(400).json({error:"Unsupported file type. Use PDF, TXT, or an image."});
      }
    } catch(err){ console.warn("Failed to parse uploaded file:",err.message); }
    fs.unlink(filePath).catch(()=>{});
    res.json({message:`Indexed ${added} chunk(s) from ${req.file.originalname}`});
  } catch(err){ console.error("upload error:",err?.response?.data||err.message); res.status(500).json({error:err.message||"Upload failed"}); }
});

// -----------------Delete a chat---------------

app.delete("/chats/:userId/:chatId", async (req, res) => {
  const { userId, chatId } = req.params;
  ensureUser(userId);
  const chats = CHATS[userId];
  const index = chats.findIndex(c => c.id === chatId);
  if (index === -1) return res.status(404).json({ error: "Chat not found" });
  chats.splice(index, 1);
  await saveChats();
  res.json({ message: "Chat deleted successfully" });
});


/* ---------------- Start ---------------- */
app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`));
