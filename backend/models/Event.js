const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventName: String,
  district: String,
  date: String,
  venue: String,
  price: Number,
  totalTickets: Number,
  availableTickets: Number,
  description: String,

  // 🆕 Event Image
  image: {
    type: String,
    required: true
  },
  isDeleted: {
  type: Boolean,
  default: false
}

});


module.exports = mongoose.model("Event", eventSchema);
