import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(false); // State for loading effect
  const [isAnimating, setIsAnimating] = useState(false); // To track animation state

  useEffect(() => {
    fetch("http://localhost:5001/api/state")
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content);
        setChoices(data.choices);
      })
      .catch((error) => console.error("Error fetching game state:", error));
  }, []);

  const handleChoice = (choice) => {
    setLoading(true); // Show loading effect

    fetch("http://localhost:5001/api/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        setContent("");
        if (!isAnimating) {
          animateText(data.content); // Only trigger animation if not already animating
        }
        setChoices(data.choices);
      })
      .catch((error) => {
        console.error("Error submitting choice:", error);
        setLoading(false);
      });
  };

  // Function to animate text appearing like typing
  const animateText = (text) => {
    let index = 0;
    let newText = ""; // Use a local variable to track the content
    setIsAnimating(true);
  
    const interval = setInterval(() => {
      newText += text[index]; // Append character-by-character
      setContent(newText); // Update state
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 10);
  };
  

  // Save Game Function
  const handleSaveGame = () => {
    const gameState = { content, choices };
    const jsonString = JSON.stringify(gameState, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rpgpt_save.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Load Game Function
  const handleLoadGame = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const gameState = JSON.parse(e.target.result);
        setContent(gameState.content);
        setChoices(gameState.choices);
      } catch (error) {
        console.error("Error loading game state:", error);
      }
    };
    reader.readAsText(file);
  };

  // Function to filter out "Choices: " and everything after it from the content
  const filterContent = (text) => {
    const index = text.indexOf("Choices:");
    return index !== -1 ? text.slice(0, index).trim() : text;
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">RPGPT - An RPG inside ChatGPT!</h1>

      <div className="w-full max-w-lg bg-slate-800 text-white p-6 rounded-lg shadow-lg mb-6">
        {loading ? (
          <p className="text-gray-400 animate-pulse">Loading...</p>
        ) : (
          <p>{filterContent(content)}</p> // Apply filtering here
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice)}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition duration-300"
            disabled={loading || isAnimating} // Disable buttons while loading or animating
          >
            {choice}
          </button>
        ))}
      </div>

      {/* Save & Load Buttons */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={handleSaveGame}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Save Game
        </button>
        <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition duration-300 cursor-pointer">
          Load Game
          <input
            type="file"
            accept=".json"
            onChange={handleLoadGame}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
