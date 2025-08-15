import { useEffect, useState } from "react";

function App() {
  const [image, setImage] = useState("");

  useEffect(() => {
    setImage("/api/image"); // Kubernetes ingress will route /api to backend
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <h1>The Project App</h1>
      {image && <img src={image} alt="Random" style={{ width: "80%" }} />}
      <p>DevOps with Kubernetes 2025</p>
    </div>
  );
}

export default App;
