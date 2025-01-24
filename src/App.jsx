import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [choices, setChoices] = useState([]);

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
    fetch("http://localhost:5001/api/choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    })
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content);
        setChoices(data.choices);
      })
      .catch((error) => console.error("Error submitting choice:", error));
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">RPGPT - An RPG inside ChatGPT!</h1>
      <div className="w-full max-w-lg bg-slate-800 text-white p-6 rounded-lg shadow-lg mb-6">
        <p>{content}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {choices.map((choice, index) => (
          <button
            key={index}
            onClick={() => handleChoice(choice)}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
