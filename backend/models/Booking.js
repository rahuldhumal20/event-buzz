const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  quantity: Number,
  totalAmount: Number,
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
  type: String,
  default: "CONFIRMED" // CONFIRMED | CANCELLED
  },
  isUsed: {
  type: Boolean,
  default: false
  },
  attendeeName: {
  type: String,
  required: true
  },
  attendeeMobile: {
  type: String,
  default: ""
 },


  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },


});

module.exports = mongoose.model("Booking", bookingSchema);