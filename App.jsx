import React, { useState, useEffect, useRef } from "react";

const BASE_URL = "http://localhost:5000";
const USER_ID = "user123"; // Replace with actual userId

const languages = {
  en: { name: "English", code: "en-US" },
  ta: { name: "Tamil", code: "ta-IN" },
  hi: { name: "Hindi", code: "hi-IN" },
};

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [chatId, setChatId] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize chat and speech recognition
  useEffect(() => {
    // Create new chat
    fetch(`${BASE_URL}/chats/${USER_ID}/new`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => setChatId(data.id))
      .catch((err) => console.error("Error creating chat:", err));

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) recognitionRef.current.stop();

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = languages[language].code;
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setQuestion(speechResult);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
      };
    } else {
      recognitionRef.current = null;
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [language]);

  // Start listening
  const startListening = () => {
    if (recognitionRef.current) recognitionRef.current.start();
    else alert("Speech Recognition not supported in your browser");
  };

  // Speak AI answer
  const speakAnswer = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languages[language].code;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Ask AI
  const askAI = async () => {
    if (!question.trim() || !chatId) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(`${BASE_URL}/chats/${USER_ID}/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: question }),
      });

      const data = await res.json();
      const aiAnswer = data.answer || data.chat?.answer;
      setAnswer(aiAnswer);
      speakAnswer(aiAnswer);
    } catch (err) {
      console.error(err);
      setAnswer("⚠️ Error: Could not reach AI backend");
    }

    setLoading(false);
  };
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: 600, margin: "auto" }}>
      <h1>🤖 My Mentor AI</h1>

      <label>
        Choose Language:{" "}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ padding: "5px", marginBottom: "10px" }}
        >
          {Object.entries(languages).map(([key, { name }]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <textarea
        rows="3"
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        placeholder="Ask me anything..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button
          onClick={askAI}
          disabled={loading || !chatId}
          style={{ padding: "10px 20px", marginRight: 10, fontWeight: "bold", cursor: "pointer" }}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

        <button
          onClick={startListening}
          style={{ padding: "10px 20px", fontWeight: "bold", cursor: "pointer" }}
        >
          🎤 Speak Question
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "5px", fontSize: "16px" }}>
          <strong>AI says:</strong> {answer}
        </div>
      )}
    </div>
  );
}
