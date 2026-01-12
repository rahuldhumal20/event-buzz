import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import API from "../services/api";
import { Container, Card, Alert } from "react-bootstrap";

export default function AdminScanner() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          const parsed = JSON.parse(decodedText);

          const res = await API.post("/bookings/verify", {
            bookingId: parsed.bookingId
          });

          setMessage(res.data.message);
          setError("");
        } catch (err) {
          setMessage("");
          setError(
            err.response?.data?.message || "Invalid QR code"
          );
        }
      },
      (scanError) => {
        // ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <Container className="mt-4">
      <h2>Admin QR Scanner</h2>

      <Card className="p-3 shadow-sm">
        <div id="qr-reader" style={{ width: "100%" }} />

        {message && (
          <Alert variant="success" className="mt-3">
            {message}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Card>
    </Container>
  );
}
