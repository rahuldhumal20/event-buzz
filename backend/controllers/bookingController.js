const Booking = require("../models/Booking");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const User = require("../models/User");


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

/* ================= DOWNLOAD TICKET ================= */
exports.downloadTicket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("eventId")
      .populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId._id.toString() !== req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (booking.status !== "CONFIRMED") {
      return res.status(403).json({ message: "Only confirmed tickets can be downloaded" });
    }

    const qrData = JSON.stringify({
      bookingId: booking._id,
      event: booking.eventId.eventName,
      attendee: booking.attendeeName
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const path = require("path");
    const PDFDocument = require("pdfkit");

    const doc = new PDFDocument({
      size: "A4",
      margin: 0
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
    );

    doc.pipe(res);

    // 🔥 FULL BACKGROUND IMAGE
    const bgPath = path.join(__dirname, "../assets/holi-ticket-bg.jpg");

    doc.image(bgPath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height
    });

    // 🔥 White overlay box for readability
    doc
      .rect(60, 120, doc.page.width - 120, 360)
      .fillOpacity(0.9)
      .fill("white")
      .fillOpacity(1);

    let y = 150;
    const leftX = 90;

    doc.fillColor("black");

    doc.fontSize(22).text(booking.eventId.eventName, leftX, y);
    y += 35;

    doc.fontSize(14).text(`Venue: ${booking.eventId.venue}`, leftX, y);
    y += 25;

    doc.text(`Date: ${booking.eventId.date}`, leftX, y);
    y += 25;

    doc.text(`Attendee: ${booking.attendeeName}`, leftX, y);
    y += 25;

    doc.text(`Mobile: ${booking.attendeeMobile || "N/A"}`, leftX, y);
    y += 25;

    doc.text(`Tickets: ${booking.quantity}`, leftX, y);
    y += 25;

    doc.text(`Amount Paid: ₹${booking.totalAmount}`, leftX, y);
    y += 30;

    doc.font("Helvetica-Bold").text(`Booking ID: ${booking._id}`, leftX, y);
    doc.font("Helvetica");

    // 🔥 QR Code on Right
    doc.image(qrImage, doc.page.width - 220, 180, {
      width: 140
    });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Download failed" });
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