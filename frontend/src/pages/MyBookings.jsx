import { useEffect, useState } from "react";
import API from "../services/api";
import { Container, Card, Badge, Button } from "react-bootstrap";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await API.get("/bookings/my");

    // 🔥 SORT LOGIC
    const sorted = res.data.sort((a, b) => {
      // 1️⃣ Active bookings first
      if (a.status === "CANCELLED" && b.status !== "CANCELLED") return 1;
      if (a.status !== "CANCELLED" && b.status === "CANCELLED") return -1;

      // 2️⃣ Newer bookings first
      return new Date(b.bookingDate) - new Date(a.bookingDate);
    });

    setBookings(sorted);
  };

  const cancelHandler = async (id) => {
  if (!window.confirm("Are you sure you want to cancel this ticket?")) return;

  // 🔥 Optimistic UI update
  setBookings((prev) =>
    prev.map((b) =>
      b._id === id ? { ...b, status: "CANCELLED" } : b
    )
  );

  try {
      await API.put(`/bookings/cancel/${id}`);
    } catch (error) {
      alert("Cancel failed. Please refresh.");

      // rollback if failed
      fetchBookings();
    }
  };


const downloadHandler = async (id) => {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You are not logged in");
    return;
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/bookings/download/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const err = await response.json();
    alert(err.message || "Download not allowed");
    return;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  // ✅ MOBILE SAFE
  window.open(url, "_blank");

  // cleanup (delay needed for mobile)
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 5000);
};



  // 🕒 Date formatter
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">My Tickets</h2>

      {bookings.length === 0 && <p>No bookings found.</p>}

    {bookings.map((booking) => {
  // 🔐 SAFETY CHECK
  if (!booking.eventId) {
    return (
      <Card key={booking._id} className="mb-3 shadow-sm border-danger">
        <Card.Body>
          <h5 className="text-danger">Event no longer available</h5>
          <p className="text-muted mb-2">
            This event was removed by admin.
          </p>

          <Badge bg="secondary">
            {booking.status}
          </Badge>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card
      key={booking._id}
      className={`mb-3 shadow-sm ${
        booking.status === "CANCELLED" ? "opacity-75" : ""
      }`}
    >
      <Card.Body>
        <h5>{booking.eventId.eventName}</h5>
        <p className="mb-1">
          👤 Attendee: <b>{booking.attendeeName}</b>
        </p>


        <p className="mb-1">
          🎟 Tickets: {booking.quantity} <br />
          💰 Amount: ₹{booking.totalAmount}
        </p>

        <p className="text-muted mb-2">
          📅 Booked on: {formatDateTime(booking.bookingDate)}
        </p>

        <Badge
          bg={booking.status === "CANCELLED" ? "danger" : "success"}
          className="me-2"
        >
          {booking.status}
        </Badge>

        {booking.status !== "CANCELLED" && (
          <>
            {booking.status === "CONFIRMED" && (
            <Button
              variant="outline-primary"
              size="sm"
              className="me-2"
              onClick={() => downloadHandler(booking._id)}
            >
              Download Ticket
            </Button>
          )}


                      {booking.status === "CONFIRMED" && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => cancelHandler(booking._id)}
            >
              Cancel Ticket
            </Button>
          )}

          </>
        )}
      </Card.Body>
    </Card>
  );
})}

      
    </Container>
  );
}