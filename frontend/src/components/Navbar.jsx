import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, isAdmin, logout } from "../services/auth";

export default function Navigation() {
  const navigate = useNavigate();

  const logoutHandler = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Event Buzz</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/">Events</Nav.Link>

            {isLoggedIn() ? (
              <>
                <Nav.Link as={Link} to="/my-bookings">
                  My Tickets
                </Nav.Link>

            
                {isAdmin() && (
                  <>
                    <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
                    <Nav.Link as={Link} to="/admin/scanner">Scanner</Nav.Link>
                    <Nav.Link as={Link} to="/admin/analytics">
                      Analytics
                    </Nav.Link>
                  </>
                )}

                

                <Nav.Link onClick={logoutHandler}>
                  Logout
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
