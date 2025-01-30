import { OpenAI } from 'openai'; // Import OpenAI correctly
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config(); // Load environment variables

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI with the API Key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use environment variable for API key
});

// Default game state
let gameState = {
  content: "You find yourself in a dark forest. Paths stretch out to the north and east.",
  choices: ["Go north", "Go east"],
  history: [], // Add history to the game state
};

// API Routes

// Fetch the current game state
app.get("/api/state", (req, res) => {
  res.json(gameState);
});

// Handle user choices and fetch the next GPT response
app.post("/api/choice", async (req, res) => {
  const { choice } = req.body;

  if (!choice || !gameState.choices.includes(choice)) {
    return res.status(400).json({ error: "Invalid choice" });
  }

  try {
    // Generate the GPT prompt based on the user's choice
    const prompt = `
      The player has chosen: "${choice}".
      Current game state: "${gameState.content}".
      Respond with the next part of the story and a list of 2-4 choices.
      Format your response as:
      Story: <new content>
      Choices:
      1. <choice 1>
      2. <choice 2>
      (add up to 4 choices)
    `;

    // Call GPT API
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 300,
    });


    const text = response.choices[0].message.content.trim();

    // Parse the response for the story and choices
    const storyMatch = text.match(/Story:(.*)/s);
    const choicesMatch = text.match(/Choices:(.*)/s);

    if (!storyMatch || !choicesMatch) {
      throw new Error("Invalid GPT response format");
    }

    let newContent = storyMatch[1].trim();
    const rawChoices = choicesMatch[1]
      .split("\n")
      .filter((line) => line.trim().startsWith("1.") || line.trim().startsWith("2.") || line.trim().startsWith("3.") || line.trim().startsWith("4."));
    
    // Clean up choices by removing unnecessary spaces and undefined values
    const newChoices = rawChoices
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line) => line !== ""); // Remove any empty strings

    // Check if we have valid choices
    if (newChoices.length === 0) {
      throw new Error("No valid choices provided in GPT response.");
    }

    // Ensure the content doesn't miss the first character and remove leading empty lines if any
    newContent = newContent.replace(/^\n+/g, "");

    // Save the current state to history before updating
    gameState.history.push({
      content: gameState.content,
      choices: gameState.choices,
      choiceMade: choice,
    });

    // Update the game state (remove choices from the content)
    gameState.content = newContent;
    gameState.choices = newChoices;

    res.json(gameState);
  } catch (error) {
    console.error("Error fetching GPT response:", error.message);
    res.status(500).json({ error: "Failed to generate response" });
  }
});



// Save Game: Send current game state as JSON file
app.get("/api/save", (req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=gameState.json");
  res.json(gameState);
});

// Load Game: Accept JSON file and update game state
app.post("/api/load", (req, res) => {
  const { state } = req.body;

  if (!state || typeof state !== "object") {
    return res.status(400).json({ error: "Invalid game state" });
  }

  gameState = state;
  res.json({ message: "Game loaded successfully", gameState });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
