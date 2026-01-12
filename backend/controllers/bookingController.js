const Booking = require("../models/Booking");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const User = require("../models/User");


/* ================= BOOK TICKET ================= */
exports.bookTicket = async (req, res) => {
  const { eventId, quantity, attendeeName } = req.body;

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
    eventId,
    quantity,
    totalAmount: quantity * event.price,
    status: "CONFIRMED",     // 🔥 CRITICAL
    isUsed: false            // 🔥 CRITICAL
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

/* ================= DOWNLOAD TICKET ================= */
exports.downloadTicket = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("eventId")
    .populate("userId", "name email");

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.userId._id.toString() !== req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // 🔥 HARD SECURITY BLOCK
  if (booking.status !== "CONFIRMED") {
    return res
      .status(403)
      .json({ message: "Only confirmed tickets can be downloaded" });
  }

  if (booking.isUsed) {
    return res
      .status(403)
      .json({ message: "Used tickets cannot be downloaded" });
  }

  const qrData = JSON.stringify({
    bookingId: booking._id,
    event: booking.eventId.eventName,
    attendee: booking.attendeeName
  });

  const qrImage = await QRCode.toDataURL(qrData);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
  );

  doc.pipe(res);

  /* HEADER */
  doc.rect(0, 0, doc.page.width, 90).fill("#e91e63");
  doc.fillColor("white").fontSize(28).text("EVENT BUZZ", 50, 30);
  doc.fontSize(14).text("ENTRY PASS", doc.page.width - 150, 40);
  doc.moveDown(3);
  doc.fillColor("black");

  /* TICKET BOX */
  doc.roundedRect(40, 120, doc.page.width - 80, 300, 10).stroke("#cccccc");

  let y = 150;
  const leftX = 60;

  doc.fontSize(20).text(booking.eventId.eventName, leftX, y);
  y += 30;

  doc.fontSize(12).text(`Venue: ${booking.eventId.venue}`, leftX, y); y += 20;
  doc.text(`Date: ${booking.eventId.date}`, leftX, y); y += 20;
  doc.text(`Tickets: ${booking.quantity}`, leftX, y); y += 20;
  doc.text(`Amount Paid: INR ${booking.totalAmount}`, leftX, y);

  y += 30;
  doc.fontSize(14).text("Attendee Details", leftX, y); y += 20;
  doc.fontSize(12).text(`Attendee Name: ${booking.attendeeName}`, leftX, y);
  y += 18;
  doc.text(`Email: ${booking.userId.email}`, leftX, y);
  y += 18;
  doc.text("Booking ID:", leftX, y);
  doc.font("Helvetica-Bold").text( booking._id.toString(), leftX, y + 15, { width: 250 } );
  doc.font("Helvetica");
  

  doc.image(qrImage, doc.page.width - 220, 170, { width: 140 });
  doc.fontSize(10).text("Scan this QR at entry",
    doc.page.width - 220, 320, { width: 140, align: "center" });

  doc.fontSize(10).text(
    "Valid only for this event • Powered by Event Buzz",
    0,
    460,
    { align: "center" }
  );

  doc.end();
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
