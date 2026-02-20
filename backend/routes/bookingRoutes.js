const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const {
  bookTicket,
  getMyBookings,
  cancelBooking,
  downloadTicket,
  verifyTicket,
  getAdminAnalytics,
  getEventAnalytics
} = require("../controllers/bookingController");

router.post(
  "/verify",
  protect,
  adminOnly,
  verifyTicket
);
router.post("/book", protect, bookTicket);
router.get("/my", protect, getMyBookings);
router.put("/cancel/:id", protect, cancelBooking);
router.get("/download/:id", protect, downloadTicket);
router.get("/admin/analytics",protect, adminOnly, getAdminAnalytics);
router.get("/admin/event/:id", protect, adminOnly, getEventAnalytics);


module.exports = router;