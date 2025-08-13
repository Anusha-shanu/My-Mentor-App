import React, { useState, useEffect } from "react";
import API_BASE_URL from "../config"; // This is your config.js

function BackendTest() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch(`${API_BASE_URL}/test`)
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((err) => {
        console.error("Error fetching from backend:", err);
        setMessage("Error connecting to backend");
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Backend Connection Test</h2>
      <p>{message}</p>
    </div>
  );
}

export default BackendTest;
