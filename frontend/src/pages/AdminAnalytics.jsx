import { useEffect, useState } from "react";
import API from "../services/api";
import { Container, Row, Col, Card } from "react-bootstrap";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get("/bookings/admin/analytics").then(res => setData(res.data));
  }, []);

  if (!data) return <p>Loading...</p>;

  return (
    <Container className="mt-4">
      <h2>Admin Analytics</h2>

      <Row className="mt-4">
        <Col md={3}>
          <Card body className="text-center">
            <h6>Total Revenue</h6>
            <h3>₹{data.totalRevenue}</h3>
          </Card>
        </Col>

        <Col md={3}>
          <Card body className="text-center">
            <h6>Tickets Sold</h6>
            <h3>{data.ticketsSold}</h3>
          </Card>
        </Col>

        <Col md={3}>
          <Card body className="text-center">
            <h6>Cancelled</h6>
            <h3>{data.cancelledTickets}</h3>
          </Card>
        </Col>

        <Col md={3}>
          <Card body className="text-center">
            <h6>Scanned</h6>
            <h3>{data.scannedTickets}</h3>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}