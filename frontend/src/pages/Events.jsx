import { useEffect, useState } from "react";
import API from "../services/api";
import { Card, Button, Container, Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../services/auth";
import "../styles/events.css";


export default function Events() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
  const res = await API.get("/events");
  setEvents(res.data);
};


  return (
    <Container className="mt-4">
      <h2 className="mb-4">Upcoming Events</h2>

      <Row>
        {events.map((event) => (
          <Col xs={12} sm={6} md={4} key={event._id} className="mb-4">
            <Card
                className={`event-card h-100 ${
                    event.availableTickets === 0 ? "sold-out" : ""
                }`}
                >

              
              {/* 🖼 EVENT IMAGE */}
              <Link to={`/event/${event._id}`}>
                <Card.Img
                    src={event.image}
                    alt={event.eventName}
                    style={{ height: "200px", objectFit: "cover", cursor: "pointer" }}
                />
                </Link>


              <Card.Body>
                <Card.Title>
                    <Link
                        to={`/event/${event._id}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        {event.eventName}
                    </Link>
                    </Card.Title>


                <Card.Text>
                  📍 {event.district} <br />
                  📅 {event.date} <br />
                  💰 ₹{event.price}
                </Card.Text>

                <Badge
                  bg={event.availableTickets > 0 ? "success" : "danger"}
                  className="mb-2"
                >
                  🎟 Remaining: {event.availableTickets}
                </Badge>

                <div className="mt-3">
                  {event.availableTickets === 0 ? (
                    <Button variant="secondary" disabled className="w-100" >
                      Sold Out
                    </Button>
                  ) : isLoggedIn() ? (
                    <Button
                      as={Link}
                      to={`/book/${event._id}`}
                      variant="primary"
                      className="w-100"

                    >
                      Book Ticket
                    </Button>
                  ) : (
                    <Button as={Link} to="/login" variant="secondary" className="w-100">
                      Login to Book
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
