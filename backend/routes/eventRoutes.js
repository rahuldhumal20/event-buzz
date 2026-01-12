const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  addHoliEvent,
  getEvents,
  createEvent,
  updateEvent,
  getEventById,
  deleteEventSafely
} = require("../controllers/eventController");

router.get("/", getEvents);
router.get("/:id", getEventById);

// ADMIN
router.post("/admin/create", protect, adminOnly, createEvent);
router.put("/admin/update/:id", protect, adminOnly, updateEvent);
router.delete("/admin/delete/:id", protect, adminOnly, deleteEventSafely);

module.exports = router;
