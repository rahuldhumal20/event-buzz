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

/* ================= DOWNLOAD TICKET ================= */
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
      attendee: booking.attendeeName,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new PDFDocument({ size: "A4", margin: 0 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
    );

    doc.pipe(res);

    /* 🔥 BACKGROUND IMAGE */
    const bgPath = path.join(__dirname, "../backend/assets/ticket-bg.jpg");

    doc.image(bgPath, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    /* 🔥 WHITE OVERLAY FOR READABILITY */
    doc.rect(0, 0, doc.page.width, doc.page.height)
      .fillOpacity(0.85)
      .fill("#ffffff")
      .fillOpacity(1);

    /* HEADER */
    doc.fillColor("#e91e63")
      .fontSize(28)
      .text("EVENT BUZZ", 50, 40);

    doc.fillColor("black")
      .fontSize(14)
      .text("ENTRY PASS", doc.page.width - 150, 50);

    /* TICKET CARD */
    doc.roundedRect(40, 120, doc.page.width - 80, 330, 15)
      .fill("#ffffff")
      .stroke("#dddddd");

    let y = 150;
    const leftX = 70;

    doc.fillColor("black");

    doc.fontSize(20).text(booking.eventId.eventName, leftX, y);
    y += 30;

    doc.fontSize(12).text(`Venue: ${booking.eventId.venue}`, leftX, y);
    y += 20;

    doc.text(`Date: ${booking.eventId.date}`, leftX, y);
    y += 20;

    doc.text(`Tickets: ${booking.quantity}`, leftX, y);
    y += 20;

    doc.text(`Amount Paid: INR ${booking.totalAmount}`, leftX, y);

    y += 30;

    doc.fontSize(14).text("Attendee Details", leftX, y);
    y += 20;

    doc.fontSize(12).text(`Attendee Name: ${booking.attendeeName}`, leftX, y);
    y += 18;

    doc.text(`Mobile: ${booking.attendeeMobile || "N/A"}`, leftX, y);
    y += 18;

    doc.text(`Email: ${booking.userId.email}`, leftX, y);
    y += 18;

    doc.text("Booking ID:", leftX, y);
    doc.font("Helvetica-Bold").text(
      booking._id.toString(),
      leftX,
      y + 15,
      { width: 300 }
    );

    doc.font("Helvetica");

    /* QR CODE */
    doc.image(qrImage, doc.page.width - 220, 180, {
      width: 150,
    });

    doc.fontSize(10).text(
      "Scan this QR at entry",
      doc.page.width - 220,
      340,
      { width: 150, align: "center" }
    );

    /* FOOTER */
    doc.fontSize(10)
      .fillColor("black")
      .text(
        "Valid only for this event • Powered by Event Buzz",
        0,
        760,
        { align: "center" }
      );

    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
console.log("Download Ticket Function Running");

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