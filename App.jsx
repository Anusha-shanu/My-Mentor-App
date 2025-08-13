import React, { useState, useEffect, useRef } from "react";
import API_BASE_URL from "./config";

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
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
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
  }, [language]); // Re-run effect if language changes

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    } else {
      alert("Speech Recognition not supported in your browser");
    }
  };

  const speakAnswer = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languages[language].code;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech Synthesis not supported in your browser");
    }
  };

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnswer(data.answer);
      speakAnswer(data.answer);
    } catch (error) {
      console.error(error);
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
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            marginRight: 10,
          }}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

        <button
          onClick={startListening}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🎤 Speak Question
        </button>
      </div>

      {answer && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f0f0f0",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        >
          <strong>AI says:</strong> {answer}
        </div>
      )}
    </div>
  );
}
