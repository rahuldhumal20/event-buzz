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

    console.log("BOOKING:", booking);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({ message: "Download route working", booking });

  } catch (error) {
    console.log("DOWNLOAD ERROR:", error);
    return res.status(500).json({ message: "Server crashed" });
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