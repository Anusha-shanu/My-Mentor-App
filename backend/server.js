// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running ✅");
});

// Chat endpoint (Hugging Face)
app.post("/chats/:userId/:chatId/message", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_API_KEY) {
      return res.status(500).json({ error: "Hugging Face API key not set" });
    }

    const HF_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1"; // You can change to another HF model

    const hfResponse = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: message
      })
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      return res.status(hfResponse.status).json({ error: errorText });
    }

    const data = await hfResponse.json();

    let botReply = "";
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      botReply = data[0].generated_text;
    } else if (typeof data === "object" && data.generated_text) {
      botReply = data.generated_text;
    } else {
      botReply = "Sorry, I couldn't generate a reply.";
    }

    res.json({ reply: botReply });

  } catch (error) {
    console.error("Error in /message route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
