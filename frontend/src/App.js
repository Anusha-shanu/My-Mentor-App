import React, { useState, useEffect, useRef } from "react";
import API_BASE_URL from "./config";
import ChatSidebar from "./ChatSidebar";
import logo from "./mymentor_logo.jpg";

const languages = {
  en: { name: "English", code: "en-US" },
  ta: { name: "Tamil", code: "ta-IN" },
  hi: { name: "Hindi", code: "hi-IN" },
};

function generateId() {
  return Date.now().toString();
}

export default function App() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState({ id: 1, name: "Demo Student", email: "student@example.com" });
  const [voices, setVoices] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Load voices for speech synthesis
  useEffect(() => {
    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Setup Speech Recognition
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

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [language]);

  // Auto-fetch or create chat on load
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chats/${user.id}`);
        const existingChats = await res.json();

        if (existingChats.length > 0) {
          setChats(existingChats);
          setSelectedChatId(existingChats[0].id);
        } else {
          const newRes = await fetch(`${API_BASE_URL}/chats/${user.id}/new`, { method: "POST" });
          const newChat = await newRes.json();
          setChats([newChat]);
          setSelectedChatId(newChat.id);
        }
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    };
    initChat();
  }, [user.id]);

  // Persist chats to localStorage
  useEffect(() => {
    localStorage.setItem("myMentorChats", JSON.stringify(chats));
  }, [chats]);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Speech Recognition not supported");

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
const utteranceRef = useRef(null);

const speakAnswer = (text) => {
  if (!("speechSynthesis" in window) || !text) return;

  // Stop any previous speech
  window.speechSynthesis.cancel();
  setIsSpeaking(false);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languages[language].code;

  const femaleVoice = voices.find(
    (v) =>
      v.lang.startsWith(languages[language].code) &&
      v.name.toLowerCase().includes("female")
  );
  const anyFemale = voices.find((v) =>
    v.name.toLowerCase().includes("female")
  );

  utterance.voice = femaleVoice || anyFemale || voices[0];
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);

  utteranceRef.current = utterance;
  window.speechSynthesis.speak(utterance);
};

// Toggle voice on/off
const toggleVoice = () => {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  } else if (answer) {
    speakAnswer(answer);
  }
};

  const askAI = async () => {
    if (!question.trim() || !selectedChatId) return;
    setLoading(true);
    setAnswer("");
    setUploadStatus("");

    try {
      console.log("Sending question:", question);
      const response = await fetch(`${API_BASE_URL}/chats/${user.id}/${selectedChatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: question }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server error");
      }

      const data = await response.json();
      setAnswer(data.answer || "No answer");

      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChatId ? data.chat : chat
        )
      );

      console.log("Received data:", data);
      speakAnswer(data.answer || "No answer");
    } catch (error) {
      console.error("Error calling AI backend:", error);
      setAnswer("⚠️ Error: AI Backend not working");
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  const newChat = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${user.id}/new`, { method: "POST" });
      const newChatData = await res.json();
      setChats(prev => [newChatData, ...prev]);
      setSelectedChatId(newChatData.id);
      setAnswer("");
      setQuestion("");
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const selectChat = (id) => {
    setSelectedChatId(id);
    const chat = chats.find(c => c.id === id);
    if (chat) setAnswer(chat.answer || "");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("book", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadStatus(`✅ ${data.message}`);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus(`❌ Upload failed: ${err.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askAI();
    }
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);

  // delete chat
  const deleteChat = async (chatId) => {
    // Remove from state
    setChats(prev => prev.filter(c => c.id !== chatId));

    // Reset selected chat if deleted
    if (selectedChatId === chatId) setSelectedChatId(null);

    // Optionally, delete on backend
    try {
      await fetch(`${API_BASE_URL}/chats/${user.id}/${chatId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete chat on backend:", err);
    }
  };


  return (
    <div style={{ fontFamily: "Arial", display: "flex",flexDirection: window.innerWidth < 768 ? "column" : "row", height: "100vh", maxWidth: 1200, margin: "auto", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        user={user}
      />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f9f9f9" }}>
        <div style={{ textAlign: "center", padding: "15px 0", borderBottom: "1px solid #ddd", backgroundColor: "#fff" }}>
          <img src={logo} alt="My Mentor Logo" style={{ height: window.innerWidth < 768 ? "70px" : "120px", // smaller on mobile
    marginBottom: "10px" }} />
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ marginTop: 8, padding: "6px 12px", borderRadius: "20px", border: "1px solid #ccc", fontSize: "14px" }}>
            {Object.entries(languages).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "15px 20px", fontSize: 16 }}>
          {uploadStatus && <div style={{ marginBottom: 10, color: uploadStatus.startsWith("❌") ? "red" : "green" }}>{uploadStatus}</div>}

          {selectedChat?.messages && selectedChat.messages.length > 0 ? (
            selectedChat.messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: msg.role === "user" ? "right" : "left" }}>
                <span style={{
                  display: "inline-block",
                  backgroundColor: msg.role === "user" ? "#FFCCBC" : "#fff",
                  color: msg.role === "user" ? "#BF360C" : "#333",
                  padding: "8px 14px",
                  borderRadius: 20,
                  maxWidth: "70%",
                  whiteSpace: "pre-wrap",
                  boxShadow: msg.role === "user" ? "none" : "0 2px 5px rgba(0,0,0,0.1)"
                }}>
                  {msg.content}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: "#777" }}>Start a new chat or select one.</p>
          )}

          {answer && !loading && (
            <div style={{ marginTop: 15, backgroundColor: "#fff", padding: 15, borderRadius: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
              <strong>AI:</strong> {answer}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", borderTop: "1px solid #ddd", padding: "10px", background: "#fff" }}>
          <label style={{ cursor: "pointer", marginRight: "10px" }}>
            📎
            <input type="file" accept="application/pdf,.txt" style={{ display: "none" }} onChange={handleFileUpload} disabled={loading} />
          </label>

          <textarea
            placeholder="Type your question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            style={{ flex: 1, border: "1px solid #ccc", borderRadius: "25px", padding: "10px 15px", outline: "none", fontSize: "16px", resize: "none" }}
            disabled={loading}
          />

          <button
            onClick={toggleVoice}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              marginLeft: "8px",
              cursor: "pointer",
            }}
            title={isSpeaking ? "Stop voice" : "Play voice"}
          >
            {isSpeaking ? "⏹️" : "🎤"}
          </button>


          <button onClick={askAI} disabled={loading} style={{ background: "#FF5722", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", marginLeft: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "18px", opacity: loading ? 0.6 : 1 }} title="Send question">
            {loading ? "⏳" : "➤"}
          </button>
        </div>
      </main>
    </div>
  );
}
