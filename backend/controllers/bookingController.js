const Booking = require("../models/Booking");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const User = require("../models/User");
const path = require("path");



/* ================= BOOK TICKET ================= */
exports.bookTicket = async (req, res) => {

  console.log("REQ BODY:", req.body);
  
  const { eventId, quantity, attendeeName, attendeeMobile } = req.body;

  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    return res.status(404).json({ message: "Event not available" });
  }

  if (event.availableTickets < quantity) {
    return res.status(400).json({ message: "Not enough tickets available" });
  }

  let nameToUse = attendeeName;

  if (!nameToUse) {
    const user = await User.findById(req.user);
    nameToUse = user.name;
  }


  const booking = await Booking.create({
    userId: req.user,
    bookedBy: req.user,
    attendeeName: nameToUse,
    attendeeMobile: attendeeMobile || "",
    eventId,
    quantity,
    totalAmount: quantity * event.price,
    status: "CONFIRMED",
    isUsed: false
  });


  event.availableTickets -= quantity;
  await event.save();

  res.status(201).json(booking);
};




/* ================= MY BOOKINGS ================= */
exports.getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ userId: req.user })
    .populate("eventId");

  // Auto-hide deleted events
  const validBookings = bookings.filter(b => b.eventId !== null);
  res.json(validBookings);
};

/* ================= CANCEL BOOKING ================= */
exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.userId.toString() !== req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (booking.status === "CANCELLED") {
    return res.status(400).json({ message: "Booking already cancelled" });
  }

  // Restore tickets
  const event = await Event.findById(booking.eventId);
  if (event) {
    event.availableTickets += booking.quantity;
    await event.save();
  }

  booking.status = "CANCELLED";
  booking.isUsed = false;
  await booking.save();

  res.json({ message: "Booking cancelled successfully" });
};

/* ================= Download Ticket ================= */
exports.downloadTicket = async (req, res) => {
  try {
    const path = require("path");

    const booking = await Booking.findById(req.params.id)
      .populate("eventId")
      .populate("userId", "name email")
      .populate("bookedBy", "name role");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.userId._id.toString() !== req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (booking.status !== "CONFIRMED")
      return res.status(403).json({ message: "Only confirmed tickets allowed" });

    if (booking.isUsed)
      return res.status(403).json({ message: "Ticket already used" });

    /* ================= QR GENERATION ================= */

    const qrData = JSON.stringify({
      bookingId: booking._id,
      event: booking.eventId.eventName,
      attendee: booking.attendeeName,
    });

    const qrImage = await QRCode.toDataURL(qrData);
    const qrBuffer = Buffer.from(
      qrImage.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );

    /* ================= PDF SETUP ================= */

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
    );

    doc.pipe(res);

    /* ================= BACKGROUND IMAGE ================= */

    const bgPath = path.join(__dirname, "../public/ticket-bg.jpg");

    doc.image(bgPath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    /* ================= CENTER QR ================= */

    const qrSize = 180;
    const centerX = (doc.page.width - qrSize) / 2;
    const centerY = (doc.page.height - qrSize) / 2;

    doc.image(qrBuffer, centerX, centerY, {
      width: qrSize,
    });

    /* ================= TEXT BELOW QR ================= */

    let textY = centerY + qrSize + 20;

    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(booking.attendeeName, 0, textY, { align: "center" });

    textY += 25;

    doc
      .fillColor("black")
      .font("Helvetica")
      .fontSize(14)
      .text(`Mobile: ${booking.attendeeMobile || "N/A"}`, 0, textY, {
        align: "center",
      });

    textY += 22;

    doc
      .fillColor("black")
      .fontSize(12)
      .text(`Booking ID: ${booking._id}`, 0, textY, {
        align: "center",
      });

    textY += 22;

    /* ===== NEW: ADMIN / SELLER NAME ===== */

    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(
        `Issued By: ${
          booking.bookedBy?.role === "admin"
            ? booking.bookedBy.name + " (Admin)"
            : booking.bookedBy?.name || "Event Buzz"
        }`,
        0,
        textY,
        { align: "center" }
      );

    /* ================= FOOTER ================= */

    doc.end();
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);
    res.status(500).json({ message: "Ticket generation failed" });
  }
};

/* ================= VERIFY QR ================= */
exports.verifyTicket = async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate("eventId");

  if (!booking) {
    return res.status(404).json({ message: "Invalid ticket" });
  }

  if (booking.status !== "CONFIRMED") {
    return res.status(400).json({ message: "Ticket not valid" });
  }

  if (booking.isUsed) {
    return res.status(400).json({ message: "Ticket already used" });
  }

  if (booking.eventId.isDeleted) {
    return res.status(400).json({ message: "Event no longer valid" });
  }

  booking.isUsed = true;
  await booking.save();

  res.json({
    message: "Ticket verified successfully",
    event: booking.eventId.eventName,
    attendee: booking.attendeeName
  });
};