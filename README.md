# 🎟 Event Buzz – Event Ticket Booking Platform

Event Buzz is a full-stack event ticket booking web application inspired by BookMyShow and District.
It supports online ticket booking, admin-managed events, offline bookings, QR-based tickets, and cloud deployment.

---

## 🌐 Live Deployment

🚀 **Live Website:**
👉 https://eventsbuzz.netlify.app/

> ⚠️ **Note:** The backend is hosted on a free-tier service (Render).
> It may take a few seconds to respond on the first request due to cold starts.
> Once active, the application performs normally.

---

## 🚀 Features

### 👤 User Features

* User registration & login (JWT authentication)
* Browse events with images & descriptions
* Book tickets
* View bookings (My Tickets)
* Download ticket as PDF with QR code
* Cancel bookings
* Mobile-friendly responsive UI

### 👨‍💼 Admin Features

* Admin dashboard
* Add / edit / delete events
* Offline ticket booking for users
* Custom attendee name on ticket
* QR code ticket verification
* Prevent ticket reuse (mark as used)

---

## 🛠 Tech Stack

### Frontend

* React (Vite)
* React Router DOM
* Axios
* Bootstrap / React Bootstrap

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* PDFKit
* QRCode

### Deployment

* Frontend: Netlify
* Backend: Render
* Database: MongoDB Atlas

---

## 📁 Project Structure

```bash
event-buzz/
│
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Entry point
│   └── .env             # Environment variables (ignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # Application pages
│   │   ├── components/  # Reusable UI components
│   │   ├── services/    # API calls
│   │   └── styles/      # CSS files
│   ├── .env
│   └── vite.config.js
│
├── README.md
├── requirements.txt
└── .gitignore
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_url
JWT_SECRET=your_secret_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 📦 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/event-buzz.git
cd event-buzz
```

### 2️⃣ Install Dependencies

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ▶️ Run Locally

* Backend: http://localhost:5000
* Frontend: http://localhost:5173

---

## 🧠 Key Learnings

* JWT authentication & role-based access
* Secure REST API design
* QR-based ticket validation
* Optimistic UI updates
* Mobile-first responsive design
* Cloud deployment with environment variables

---

## ⭐ Future Enhancements

* Online payment integration (Razorpay)
* Seat selection system
* Event analytics dashboard
* Progressive Web App (PWA)
* Email ticket delivery

---

## 👨‍💻 Author

**Rahul Dhumal**

---

> 💡 *Event Buzz is a production-ready ticket booking platform with real-world features and cloud deployment.*
