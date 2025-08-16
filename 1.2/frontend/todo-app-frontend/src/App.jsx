import { useEffect, useState } from "react";

function App() {
  const [image, setImage] = useState("");
  const [todos, setTodos] = useState([
    "Finish Kubernetes exercise",
    "Review Node.js backend",
    "Plan DevOps roadmap",
  ]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    setImage("/api/image"); // Kubernetes ingress will route /api to backend
  }, []);

  const handleAddTodo = () => {
    if (newTodo.trim() === "" || newTodo.length > 140) return;
    setTodos([...todos, newTodo]);
    setNewTodo("");
  };

  return (
    <div style={{ textAlign: "center", margin: "2rem" }}>
      <h1>The Project App</h1>

      {image && (
        <img
          src={image}
          alt="Random"
          style={{ width: "80%", marginBottom: "1rem" }}
        />
      )}
      <p>DevOps with Kubernetes 2025</p>

      {/* Todo App Section */}
      <div style={{ marginTop: "2rem" }}>
        <h2>Todo App</h2>
        <div>
          <input
            type="text"
            value={newTodo}
            placeholder="Enter a todo (max 140 chars)"
            onChange={(e) => setNewTodo(e.target.value)}
            style={{ padding: "8px", width: "250px", marginRight: "8px" }}
          />
          <button
            onClick={handleAddTodo}
            style={{
              padding: "8px 12px",
              backgroundColor: "blue",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add Todo
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
          {todos.map((todo, index) => (
            <li
              key={index}
              style={{
                background: "#1c1818ff",
                margin: "6px auto",
                padding: "8px",
                width: "300px",
                borderRadius: "4px",
              }}
            >
              {todo}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;