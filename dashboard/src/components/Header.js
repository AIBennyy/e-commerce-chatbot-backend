import React from 'react';
import { Navbar, Container } from 'react-bootstrap';

function Header() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="dashboard-header">
      <Container fluid>
        <Navbar.Brand href="/dashboard">E-Commerce Chatbot Dashboard</Navbar.Brand>
        <div className="d-flex">
          <span className="text-light">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </Container>
    </Navbar>
  );
}

export default Header;
