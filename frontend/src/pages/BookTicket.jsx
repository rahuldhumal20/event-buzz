import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import {
  Container,
  Card,
  Button,
  Form,
  Alert
} from "react-bootstrap";

export default function BookTicket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    const res = await API.get(`/events/${id}`);
    setEvent(res.data);
  };

  const bookHandler = async () => {
    setError("");
    setSuccess("");

    try {
      await API.post("/bookings/book", {
        eventId: event._id,
        quantity: qty,
        attendeeName,
        attendeeMobile,
        passType,
        ticketCategory,
        price
      });

      setSuccess("Booking successful! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    }
  };

  if (!event) return null;

  return (
    <Container className="mt-4">
      
      {/* 🖼 BIG BANNER IMAGE */}
      <Card className="mb-4 shadow-sm">
        <Card.Img
          src={event.image}
          alt={event.eventName}
          style={{ height: "300px", objectFit: "cover" }}
        />
      </Card>

      <Card className="p-4 shadow-sm">
        <h3>{event.eventName}</h3>

        <p className="text-muted">
          📍 {event.venue} <br />
          📅 {event.date} <br />
          💰 ₹{event.price}
        </p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Quantity</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </Form.Group>

        <Button onClick={bookHandler} variant="primary">
          Confirm Booking
        </Button>
      </Card>
    </Container>
  );
}
