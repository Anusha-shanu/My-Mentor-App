import React from "react";

export default function ChatSidebar({ chats, selectedChatId, onNewChat, onSelectChat, user }) {
  return (
    <aside style={{ width: 250, borderRight: "1px solid #ddd", backgroundColor: "#f5f5f5", display: "flex", flexDirection: "column" }}>
      
      {/* Header */}
      <div style={{ padding: "15px", borderBottom: "1px solid #ddd", backgroundColor: "#fff", textAlign: "center" }}>
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
            onClick={() => onSelectChat(chat.id)}
            style={{
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: chat.id === selectedChatId ? "#FFCCBC" : "#fff",
              color: chat.id === selectedChatId ? "#BF360C" : "#333",
              boxShadow: chat.id === selectedChatId ? "0 2px 5px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {chat.title || `Chat ${chat.id}`}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: "1px solid #ddd", backgroundColor: "#fff", textAlign: "center" }}>
        <small>My Mentor AI</small>
      </div>
    </aside>
  );
}
