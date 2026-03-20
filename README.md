# 🎟 Event Buzz – Event Ticket Booking Platform

Event Buzz is a full-stack event ticket booking web application inspired by BookMyShow and District.  
It supports online ticket booking, admin-managed events, offline bookings, QR-based tickets, and cloud deployment.

---

## 🌐 Live Deployment

🚀 **Live Website:**  
👉 https://eventsbuzz.netlify.app/

The backend is deployed on a free-tier hosting service. 
As a result, the server may enter a sleep state during inactivity and can take a few seconds to respond on the first request.

Subsequent requests will perform normally once the server is active.
---

## 🚀 Features

### 👤 User Features
- User registration & login (JWT authentication)
- Browse events with images & descriptions
- Book tickets
- View bookings (My Tickets)
- Download ticket as PDF with QR code
- Cancel bookings
- Mobile-friendly responsive UI

### 👨‍💼 Admin Features
- Admin dashboard
- Add / edit / delete events
- Book tickets for other people (offline booking)
- Custom attendee name on ticket
- QR code ticket verification
- Prevent ticket reuse (mark as used)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- React Router DOM
- Axios
- React Bootstrap
- Bootstrap

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- PDFKit
- QRCode

### Deployment
- Frontend: Netlify  
- Backend: Render  
- Database: MongoDB Atlas  

---

## 📁 Project Structure

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

## ⚙️ Environment Variables

### Backend (`backend/.env`)
PORT=5000
MONGO_URI=your_mongodb_atlas_url
JWT_SECRET=your_secret_key


### Frontend (`frontend/.env`)
VITE_API_URL=https://your-backend.onrender.com/api

yaml
Copy code

---

## 📦 Installation & Setup

### 1️⃣ Clone Repository
git clone https://github.com/your-username/event-buzz.git
cd event-buzz

### 2️⃣ Install Dependencies (Using requirements.txt)

This project includes a **Node-compatible `requirements.txt`**.

#### Backend
cd backend
npm install $(cat ../requirements.txt)
npm run dev

#### Frontend
cd frontend
npm install $(cat ../requirements.txt)
npm run dev


## ▶️ Run Locally

- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:5173`

---

## 🧠 Key Learnings
- JWT authentication & role-based access
- Secure REST API design
- QR-based ticket validation
- Optimistic UI updates
- Mobile-first responsive design
- Cloud deployment with environment variables

---

## 👨‍💻 Author
**Rahul Dhumal**  
M.Sc. Computer Applications

---

## ⭐ Future Enhancements
- Online payment integration (Razorpay)
- Seat selection
- Event analytics dashboard
- Progressive Web App (PWA)
- Email ticket delivery

---

> “Event Buzz is a production-ready ticket booking platform with real-world features and cloud deployment
