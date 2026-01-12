import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Alert
} from "react-bootstrap";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    eventName: "",
    district: "",
    date: "",
    venue: "",
    price: "",
    totalTickets: "",
    image: "",
    description: ""
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await API.get("/events");
    setEvents(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.image) {
      setError("Event image URL is required");
      return;
    }

    try {
      await API.post("/events/admin/create", {
        eventName: form.eventName,
        district: form.district,
        date: form.date,
        venue: form.venue,
        price: Number(form.price),
        totalTickets: Number(form.totalTickets),
        availableTickets: Number(form.totalTickets),
        image: form.image,
        description: form.description
      });

      setSuccess("Event added successfully!");

      setForm({
        eventName: "",
        district: "",
        date: "",
        venue: "",
        price: "",
        totalTickets: "",
        image: "",
        description: ""
      });

      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add event");
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-3">Admin Dashboard</h2>

      <Card className="p-4 mb-4 shadow-sm">
        <h4 className="mb-3">Add New Event</h4>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={submitHandler}>
          <Row className="mb-2">
            <Col>
              <Form.Control
                name="eventName"
                value={form.eventName}
                onChange={handleChange}
                placeholder="Event Name"
                required
              />
            </Col>
            <Col>
              <Form.Control
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="District"
                required
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col>
              <Form.Control
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </Col>
            <Col>
              <Form.Control
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="Venue"
                required
              />
            </Col>
          </Row>

          <Row className="mb-2">
            <Col>
              <Form.Control
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ticket Price"
                required
              />
            </Col>
            <Col>
              <Form.Control
                type="number"
                name="totalTickets"
                value={form.totalTickets}
                onChange={handleChange}
                placeholder="Total Tickets"
                required
              />
            </Col>
          </Row>

          {/* 🆕 IMAGE URL */}
          <Form.Group className="mb-2">
            <Form.Control
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="Event Image URL (https://...)"
              required
            />
          </Form.Group>

          {/* 🆕 DESCRIPTION */}
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Event Description"
            />
          </Form.Group>

          <Button
            variant="light"
            className="mb-1"
            onClick={() => navigate("/admin/scanner")}
          >
            QR Scanner
          </Button>

          <Button type="submit" variant="primary">
            Add Event
          </Button>
        </Form>
      </Card>

      <h4>All Events</h4>
      {events.map((e) => (
        <Card key={e._id} className="mb-2 p-3 d-flex flex-row justify-content-between align-items-center">
            <div>
            <b>{e.eventName}</b> – {e.district} – ₹{e.price}
            </div>

            <Button
            variant="outline-danger"
            size="sm"
            onClick={async () => {
                if (!window.confirm("Delete this event? This will cancel all bookings.")) return;
                await API.delete(`/events/admin/delete/${e._id}`);
                fetchEvents();
            }}
            >
            Delete
            </Button>
        </Card>
        ))}

    </Container>
  );
}
