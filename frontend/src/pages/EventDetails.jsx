import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";
import { Form } from "react-bootstrap";
import { isAdmin } from "../services/auth";

import {
  Container,
  Card,
  Button,
  Badge,
  Row,
  Col
} from "react-bootstrap";
import { isLoggedIn } from "../services/auth";
import "../styles/animations.css";


export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bookHandler = async () => {
    if (qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    if (isAdmin() && attendeeName.trim() === "") {
      setError("Attendee name is required for admin booking");
      return;
    }

    try {
      await API.post("/bookings/book", {
        eventId: event._id,
        quantity: qty,
        attendeeName: isAdmin() ? attendeeName : undefined
      });

      navigate("/my-bookings");
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    }
  };




  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    const res = await API.get(`/events/${id}`);
    setEvent(res.data);
  };

  if (!event) return null;

  return (
    <Container className="mt-4 fade-in">
      {/* BIG IMAGE */}
      <Card className="mb-4 shadow-sm fade-in">
        <Card.Img
          src={event.image}
          alt={event.eventName}
          style={{ height: "400px", objectFit: "cover" }}
        />
      </Card>

      <Row>
        <Col md={8}>
          <h2>{event.eventName}</h2>

          <p className="text-muted">
            📍 {event.venue} <br />
            📅 {event.date}
          </p>

          <p>{event.description}</p>
        </Col>

        <Col md={4}>
          <Card className="p-3 shadow-sm">
            <h4>₹ {event.price}</h4>

            <Badge
              bg={event.availableTickets > 0 ? "success" : "danger"}
              className="mb-3"
            >
              🎟 Remaining: {event.availableTickets}
            </Badge>
            {isAdmin() && (
              <Form.Group className="mb-3">
                <Form.Label>Attendee Name</Form.Label>
                <Form.Control
                  placeholder="Enter ticket holder name"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  required
                />
              </Form.Group>
            )}

              {event.availableTickets === 0 ? (
                <Button variant="secondary" disabled className="w-100">
                  Sold Out
                </Button>
              ) : isLoggedIn() ? (
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={bookHandler}   // 🔥 IMPORTANT
                >
                  Book Ticket
                </Button>
              ) : (
                <Button
                  as={Link}
                  to="/login"
                  variant="secondary"
                  className="w-100"
                >
                  Login to Book
                </Button>
              )}

          </Card>
        </Col>
      </Row>
    </Container>
  );
}
