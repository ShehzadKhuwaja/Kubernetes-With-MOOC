import { useEffect, useState } from "react";

function App() {
  const [image, setImage] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  // Load image and todos from backend
  useEffect(() => {
    setImage("/api/image"); // Kubernetes ingress will route /api to backend

    // Fetch todos from backend
    fetch("/api/todos")
      .then((res) => res.json())
      .then((data) => setTodos(data))
      .catch((err) => console.error("Error fetching todos:", err));
  }, []);

  const handleAddTodo = async () => {
    if (newTodo.trim() === "" || newTodo.length > 140) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTodo }),
      });

      if (!response.ok) {
        console.error("Failed to add todo");
        return;
      }

      const savedTodo = await response.json();
      setTodos([...todos, savedTodo]);
      setNewTodo("");
    } catch (err) {
      console.error("Error adding todo:", err);
    }
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
          {todos.map((todo) => (
            <li
              key={todo.id}
              style={{
                background: "#1c1818ff",
                margin: "6px auto",
                padding: "8px",
                width: "300px",
                borderRadius: "4px",
              }}
            >
              {todo.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;