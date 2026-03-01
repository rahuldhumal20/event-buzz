import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { Container, Card, Row, Col, Table, Badge } from "react-bootstrap";

export default function EventAnalytics() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get(`/bookings/admin/event/${id}`)
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  }, [id]);

  if (!data) return <p>Loading...</p>;

  return (
    <Container className="mt-4">
      <h2>{data.eventName} Analytics</h2>

      {/* ===== ANALYTICS CARDS ===== */}
      <Row className="mt-4 g-3">
        <Col md={4}><Card body>Total Tickets: {data.totalTickets}</Card></Col>
        <Col md={4}><Card body>Sold: {data.sold}</Card></Col>
        <Col md={4}><Card body>Remaining: {data.remaining}</Card></Col>
        <Col md={4}><Card body>Cancelled: {data.cancelled}</Card></Col>
        <Col md={4}><Card body>Scanned: {data.scanned}</Card></Col>
        <Col md={4}><Card body>Remaining to Scan: {data.remainingToScan}</Card></Col>
      </Row>

      {/* ===== ATTENDEE TABLE ===== */}
      <h4 className="mt-4 mb-3">Attendee List</h4>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Attendee Name</th>
            <th>Mobile</th>
            <th>Tickets</th>
            <th>Category</th>
            <th>Pass Type</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th>Scan</th>
          </tr>
        </thead>

        <tbody>
          {data.bookings?.map((b, index) => (
            <tr key={b._id}>
              <td>{index + 1}</td>

              <td>{b.attendeeName}</td>

              <td>{b.attendeeMobile || "-"}</td>

              <td>{b.quantity}</td>

              {/* ✅ Ticket Category */}
              <td>{b.ticketCategory || "General"}</td>

              {/* ✅ Pass Type */}
              <td>{b.passType || "General"}</td>

              {/* ✅ Total Amount */}
              <td style={{ fontWeight: "600", color: "#0d6efd" }}>
                ₹{b.totalAmount || 0}
              </td>

              {/* Booking Status */}
              <td>
                <Badge bg={b.status === "CONFIRMED" ? "success" : "danger"}>
                  {b.status}
                </Badge>
              </td>

              {/* Scan Status */}
              <td>
                <Badge bg={b.isUsed ? "primary" : "secondary"}>
                  {b.isUsed ? "Scanned" : "Not Scanned"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}