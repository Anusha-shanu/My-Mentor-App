// ask-aaru.js - Connects to the backend API

export async function askAaru(prompt) {
  try {
    const response = await fetch('http://localhost:5000/api/ask-aaru', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Error in askAaru:', error);
    return 'Error connecting to My Mentor backend.';
  }
}
