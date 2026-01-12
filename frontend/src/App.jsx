import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import BookTicket from "./pages/BookTicket";
import Navigation from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import EventDetails from "./pages/EventDetails";
import AdminScanner from "./pages/AdminScanner";



function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<Events />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/event/:id" element={<EventDetails />} />

        

        {/* 🔐 PROTECTED BOOKING ROUTE */}
        <Route
          path="/book/:id"
          element={
            <ProtectedRoute>
              <BookTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/scanner"
          element={
            <AdminRoute>
              <AdminScanner />
            </AdminRoute>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
