const Booking = require("../models/Booking");
const Event = require("../models/Event");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const User = require("../models/User");
const path = require("path");



/* ================= BOOK TICKET ================= */
exports.bookTicket = async (req, res) => {

  console.log("REQ BODY:", req.body);
  
  const {
    eventId,
    quantity,
    attendeeName,
    attendeeMobile,
    passType,
    ticketCategory,
    price
  } = req.body;

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
    ticketPrice : price ,
    totalAmount: quantity * price,
    passType,
    ticketCategory,
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

    

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=EventBuzz-Ticket-${booking._id}.pdf`
    );

    doc.pipe(res);
   
    /* ================= BACKGROUND IMAGE ================= */

    // choose background based on pass type
    const bgImage =
      booking.passType === "VIP"
        ? path.join(__dirname, "../public/vip-ticket-bg.jpg")
        : path.join(__dirname, "../public/ticket-bg.jpg");

    doc.image(bgImage, 0, 0, {
      width: doc.page.width,
      height: doc.page.height,
    });

    /* ================= CENTER QR ================= */

    const qrSize = 150;
    const centerX = (doc.page.width - 170) / 2;
    const centerY = (doc.page.height - 270) / 2;

    doc.image(qrBuffer, centerX, centerY, {
      width: qrSize,
    });

    /* ===== CALCULATE TOTAL AMOUNT ===== */

    // price saved per ticket OR fallback to event price
    const pricePerTicket =
      booking.ticketPrice || booking.eventId.price || 0;

    const calculatedTotal = booking.quantity * pricePerTicket;

    /* ===== TEXT BELOW QR (FINAL) ===== */

    let textY = centerY + qrSize + 25;

    // Attendee Name
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(booking.attendeeName, 0, textY, {
        align: "center"
      });

    textY += 22;

    // Mobile
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(`Mobile: ${booking.attendeeMobile || "-"}`, 0, textY, {
        align: "center"
      });

    textY += 18;

    // Ticket Type
    doc.text(`Ticket Type: ${booking.ticketCategory || "General"}`, 0, textY, {
      align: "center"
    });

    textY += 18;

    // Number of Tickets
    doc.text(`Number of Tickets: ${booking.quantity}`, 0, textY, {
      align: "center"
    });

    textY += 18;

    // Pass Type
    doc.text(`Pass Type: ${booking.passType || "General"}`, 0, textY, {
      align: "center"
    });

    textY += 18;

    // ⭐ TOTAL AMOUNT (NEW)
    doc
      .font("Helvetica-Bold")
      .text(`Total Amount: ₹${calculatedTotal}`, 0, textY, {
        align: "center"
      });

    textY += 20;

    // Issued By
    doc
      .font("Helvetica")
      .text(
        `Issued By: ${booking.bookedBy?.name || "Admin"}`,
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
/* ================= ADMIN GLOBAL ANALYTICS ================= */
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "CONFIRMED" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    const ticketsSold = await Booking.aggregate([
      { $match: { status: "CONFIRMED" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const cancelledTickets = await Booking.aggregate([
      { $match: { status: "CANCELLED" } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    const scannedTickets = await Booking.aggregate([
      { $match: { isUsed: true } },
      { $group: { _id: null, total: { $sum: "$quantity" } } }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      ticketsSold: ticketsSold[0]?.total || 0,
      cancelledTickets: cancelledTickets[0]?.total || 0,
      scannedTickets: scannedTickets[0]?.total || 0
    });

  } catch (err) {
    res.status(500).json({ message: "Analytics failed" });
  }
};
/* ================= EVENT ANALYTICS ================= */
exports.getEventAnalytics = async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const bookings = await Booking.find({ eventId })
      .populate("userId", "name email")
      .sort({ bookingDate: -1 });

    const sold = bookings
      .filter(b => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + b.quantity, 0);

    const cancelled = bookings
      .filter(b => b.status === "CANCELLED")
      .reduce((sum, b) => sum + b.quantity, 0);

    const scanned = bookings
      .filter(b => b.isUsed)
      .reduce((sum, b) => sum + b.quantity, 0);

    const remaining = event.totalTickets - sold;
    const remainingToScan = sold - scanned;

    res.json({
      eventName: event.eventName,
      totalTickets: event.totalTickets,
      sold,
      cancelled,
      scanned,
      remaining,
      remainingToScan,
      bookings // 🔥 IMPORTANT — send full list
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Analytics failed" });
  }
};