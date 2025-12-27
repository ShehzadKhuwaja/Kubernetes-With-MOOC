import { useEffect, useState } from "react";

function App() {
  const [image, setImage] = useState("");
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const pendingTodos = todos.filter((todo) => !todo.done);
  const doneTodos = todos.filter((todo) => todo.done);

  // Runtime configs from ConfigMap (injected into window._env_)
  const backendApi = window._env_.REACT_APP_BACKEND_API;
  const appTitle = window._env_.REACT_APP_TITLE || "Default App Title";
  const maxTodoLength = parseInt(window._env_.REACT_APP_MAX_TODO_LENGTH || "140");

  // Load image and todos from backend
  useEffect(() => {
    setImage(`${backendApi}/image`);

    fetch(`${backendApi}/todos`)
      .then((res) => res.json())
      .then((data) => setTodos(data))
      .catch((err) => console.error("Error fetching todos:", err));
  }, [backendApi]);

  const handleMarkAsDone = async (todo) => {
    try {
      const response = await fetch(`${backendApi}/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...todo, done: true }),
      });

      if (!response.ok) {
        console.error("Failed to mark todo as done");
        return;
      }

      const updatedTodo = await response.json();

      setTodos((prevTodos) =>
        prevTodos.map((t) =>
          t.id === todo.id ? updatedTodo.todo : t
        )
      );
    } catch (err) {
      console.error("Error updating todo:", err);
    }
  };

  const handleAddTodo = async () => {
    if (newTodo.trim() === "" || newTodo.length > maxTodoLength) return;

    try {
      const response = await fetch(`${backendApi}/todos`, {
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
      <h1>{appTitle}</h1>

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
        <h2>Todo App Feature 2 hello world</h2>
        <div>
          <input
            type="text"
            value={newTodo}
            placeholder={`Enter a todo (max ${maxTodoLength} chars)`}
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

        <ul style={{ listStyle: "none", padding: 0 }}>
          {pendingTodos.map((todo) => (
            <li
              key={todo.id}
              style={{
                background: "#1c1818ff",
                margin: "6px auto",
                padding: "8px",
                width: "350px",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "white" }}>{todo.text}</span>

              <button
                onClick={() => handleMarkAsDone(todo)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Mark as Done
              </button>
            </li>
          ))}
        </ul>
        
        {doneTodos.length > 0 && (
          <>
            <h3 style={{ marginTop: "2rem" }}>Done ✅</h3>

            <ul style={{ listStyle: "none", padding: 0 }}>
              {doneTodos.map((todo) => (
                <li
                  key={todo.id}
                  style={{
                    background: "#2a2a2a",
                    margin: "6px auto",
                    padding: "8px",
                    width: "350px",
                    borderRadius: "4px",
                    color: "#aaa",
                    textDecoration: "line-through",
                  }}
                >
                  {todo.text}
                </li>
              ))}
            </ul>
          </>
        )}
        

      </div>
    </div>
  );
}

export default App;