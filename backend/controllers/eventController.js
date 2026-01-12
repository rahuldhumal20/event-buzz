const Event = require("../models/Event");
const Booking = require("../models/Booking");

// Add Holi Event (one time)
exports.addHoliEvent = async (req, res) => {
  const event = await Event.create({
    eventName: "Holi Bash 2026",
    district: "Pune",
    date: "2026-03-14",
    venue: "Open Ground, Hinjewadi",
    price: 499,
    totalTickets: 500,
    availableTickets: 500,
    description: "DJ • Colors • Rain Dance • Food Stalls"
  });

  res.json(event);
};

// Get all events
exports.getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};
// Add new event
exports.createEvent = async (req, res) => {
  const {
    eventName,
    district,
    date,
    venue,
    price,
    totalTickets,
    availableTickets,
    image,
    description
  } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Event image is required" });
  }

  const event = await Event.create({
    eventName,
    district,
    date,
    venue,
    price,
    totalTickets,
    availableTickets,
    image,
    description
  });

  res.status(201).json(event);
};

// Update event
exports.updateEvent = async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(event);
};
exports.getEvents = async (req, res) => {
  const events = await Event.find({ isDeleted: false });
  res.json(events);
};

exports.deleteEventSafely = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  // 1️⃣ Soft delete event
  event.isDeleted = true;
  await event.save();

  // 2️⃣ Auto-cancel all related bookings
  await Booking.updateMany(
    { eventId: event._id },
    { $set: { status: "CANCELLED" } }
  );

  res.json({ message: "Event deleted safely and bookings cancelled" });
};
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
};
