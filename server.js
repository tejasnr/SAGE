// Ensure you have Node.js >= 18
// npm install @google/generative-ai express dotenv

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const API_KEY = process.env.API_KEY;

// System instructions for the AI assistant
const systemInstructions = `
  You are an AI-powered mental health assistant designed to provide emotional and mental health support to students. 
  Your responses should reflect empathy, professionalism, and understanding. You can offer guided Vipassana meditation to help users calm their minds. 
  You can also simulate conversations with the opposite gender if the user needs help building social confidence.

  Objective: Your primary goal is to create a safe space for students, making them feel heard and supported. When the user expresses extreme emotional distress, 
  guide them toward professional help. Never offer diagnostic or medical advice.

  If the user is anxious or stressed, suggest mindfulness exercises like Vipassana. 
  If the user is nervous about social interactions, offer to simulate conversations with the opposite gender to help build confidence.
  Always maintain a calm, professional, and empathetic tone.
`;

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const generationConfig = {
    temperature: 0.2,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  // Adjusted safety settings
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    // Add more categories if needed
  ];

  // Include system instructions in chat history as a system message
  const chatHistory = [
    {
      role: "model",
      parts: [
        systemInstructions,  // Adding system instructions here
      ],
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: chatHistory,
  });

  try {
    const result = await chat.sendMessage(userInput);

    // Log the full response to inspect it
    console.log('Full API Response:', result);

    if (result && result.response && result.response.text) {
      const responseText = result.response.text(); // Call the function to get the text
      console.log('Full response text:', responseText);
      return responseText; // Return the text
    } else {
      console.error('Error: Response was undefined or missing text property');
      return "Sorry, I couldn't process your request. Please try again.";
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return "Sorry, there was an error processing your request.";
  }
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', (req, res) => {
  res.sendFile(__dirname + '/loader.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('Incoming /chat request:', userInput);

    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
