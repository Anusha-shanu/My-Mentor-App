import React, { useState } from "react";

export default function ChatSidebar({ chats, selectedChatId, onNewChat, onSelectChat, onDeleteChat, user }) {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768); // open by default on desktop

  const toggleSidebar = () => setIsOpen(prev => !prev);

  return (
    <div>
      {/* Mobile toggle */}
      {window.innerWidth < 768 && (
        <button
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: 10,
            left: 10,
            zIndex: 1000,
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "#FF5722",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isOpen ? "Close Chats" : "Open Chats"}
        </button>
      )}

      <aside
        style={{
          width: 250,
          borderRight: window.innerWidth < 768 ? "none" : "1px solid #ddd",
          backgroundColor: "#f5f5f5",
          display: isOpen ? "flex" : "none",
          flexDirection: "column",
          position: window.innerWidth < 768 ? "fixed" : "relative",
          height: "100vh",
          zIndex: 999,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "15px",
            borderBottom: "1px solid #ddd",
            backgroundColor: "#fff",
            textAlign: "center",
          }}
        >
          <strong>{user?.name || "Guest"}</strong>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          style={{
            margin: "10px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#FF5722",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>

        {/* Chat List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
          {chats.length === 0 && <p style={{ color: "#777", textAlign: "center" }}>No chats yet</p>}

          {chats.map((chat) => (
            <div
              key={chat.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: chat.id === selectedChatId ? "#FFCCBC" : "#fff",
                color: chat.id === selectedChatId ? "#BF360C" : "#333",
                boxShadow: chat.id === selectedChatId ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <div onClick={() => onSelectChat(chat.id)} style={{ flex: 1 }}>
                {chat.title || `Chat ${chat.id}`}
              </div>
              <button
                onClick={() => onDeleteChat(chat.id)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#FF5722",
                  fontSize: "16px",
                  marginLeft: "8px",
                }}
                title="Delete Chat"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
