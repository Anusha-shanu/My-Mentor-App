import React, { useState } from "react";
import API_BASE_URL from "./config"; // <-- make sure config.js exists

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error(error);
      setAnswer("⚠️ Error: Could not reach AI backend");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🤖 My Mentor AI</h1>

      <textarea
        rows="3"
        style={{ width: "100%", padding: "10px" }}
        placeholder="Ask me anything..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <br />
      <button
        onClick={askAI}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {answer && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f0f0f0",
            borderRadius: "5px",
          }}
        >
          <strong>AI says:</strong> {answer}
        </div>
      )}
    </div>
  );
}
