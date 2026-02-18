const Booking = require("../models/Booking");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");



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

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.userId._id.toString() !== req.user)
      return res.status(401).json({ message: "Unauthorized" });

    if (booking.status !== "CONFIRMED")
      return res.status(403).json({ message: "Only confirmed tickets allowed" });

    if (booking.isUsed)
      return res.status(403).json({ message: "Ticket already used" });

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

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
    );

    doc.pipe(res);
    /* ===== BACKGROUND IMAGE (SAFE VERSION) ===== */
    const bgPath = path.join(__dirname, "../public/images/holi-bg.jpg");

    if (fs.existsSync(bgPath)) {
      doc.image(bgPath, 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: "center",
        valign: "center"
      });
    }

    /* ===== TOP COLOR SPLASH STYLE HEADER ===== */

    doc.rect(0, 0, doc.page.width, 250).fill("#e62b1a");
    doc.circle(100, 100, 120).fill("#ffd166");
    doc.circle(400, 80, 150).fill("#06d6a0");
    doc.circle(300, 180, 100).fill("#118ab2");

    doc.fillColor("white")
      .fontSize(36)
      .font("Helvetica-Bold")
      .text(booking.eventId.eventName.toUpperCase(), 0, 100, {
        align: "center",
      });

    doc.fontSize(18)
      .font("Helvetica")
      .text("ENTRY PASS", 0, 150, { align: "center" });

    /* ===== DATE BLOCK ===== */

    doc.roundedRect(doc.page.width - 180, 270, 150, 80, 10)
      .fill("#111");

    doc.fillColor("white")
      .fontSize(14)
      .text("EVENT DATE", doc.page.width - 180, 280, {
        width: 150,
        align: "center",
      });

    doc.fontSize(18)
      .font("Helvetica-Bold")
      .text(booking.eventId.date, doc.page.width - 180, 305, {
        width: 150,
        align: "center",
      });

    /* ===== MAIN TICKET CARD ===== */

    doc.roundedRect(50, 280, doc.page.width - 100, 350, 20)
      .fill("#ffffff");

    let y = 320;
    const leftX = 80;

    doc.fillColor("#000")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Booking Details", leftX, y);

    y += 40;

    doc.fontSize(13).font("Helvetica");

    doc.text(`Venue: ${booking.eventId.venue}`, leftX, y); y += 25;
    doc.text(`District: ${booking.eventId.district}`, leftX, y); y += 25;
    doc.text(`Tickets: ${booking.quantity}`, leftX, y); y += 25;
    doc.text(`Amount Paid: ₹ ${booking.totalAmount}`, leftX, y);

    y += 40;

    doc.font("Helvetica-Bold").text("Attendee Information", leftX, y);
    y += 30;

    doc.font("Helvetica");
    doc.text(`Name: ${booking.attendeeName}`, leftX, y); y += 25;
    doc.text(`Mobile: ${booking.attendeeMobile || "N/A"}`, leftX, y); y += 25;
    doc.text(`Email: ${booking.userId.email}`, leftX, y);

    y += 40;

    doc.font("Helvetica-Bold").text("Booking ID:", leftX, y);
    y += 20;

    doc.font("Helvetica").text(booking._id.toString(), leftX, y);

    /* ===== QR SECTION ===== */

    doc.image(qrBuffer, doc.page.width - 200, 380, {
      width: 130,
    });

    doc.fontSize(10)
      .fillColor("#333")
      .text("Scan this QR at entry", doc.page.width - 200, 520, {
        width: 130,
        align: "center",
      });

    /* ===== FOOTER ===== */

    doc.fontSize(10)
      .fillColor("#666")
      .text(
        "Valid only for this event • Powered by Event Buzz",
        0,
        800,
        { align: "center" }
      );

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