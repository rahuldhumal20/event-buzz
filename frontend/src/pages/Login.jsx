import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

    const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    try {
        const res = await API.post("/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);

        // 🔥 Fetch user profile
        const profile = await API.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(profile.data));

        navigate("/");
    } catch (err) {
        setError(err.response?.data?.message || "Login failed");
    }
    };

  return (
    <Container className="mt-5">
      <Card className="p-4 shadow-sm">
        <h3 className="mb-3">Login</h3>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={submitHandler}>
          <Form.Control
            className="mb-3"
            placeholder="Email"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <Form.Control
            className="mb-3"
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="dark" className="w-100">
            Login
          </Button>
        </Form>
      </Card>
    </Container>
  );
}
