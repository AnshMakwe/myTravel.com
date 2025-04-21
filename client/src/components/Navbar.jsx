// src/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <nav className="navbar">
      <h1 onClick={() => navigate('/')}>MyTravel.com</h1>
      <div className="nav-links">
        {role === 'user' ? (
          <>
            <Link to="/userhome">Home</Link>
            <Link to="/searchTravel">Search</Link>
            <Link to="/myTickets">Tickets</Link>
            <Link to="/depositFunds">Deposit</Link>
            <Link to="/updateCustomer">Update Profile</Link>
            <Link to="/ticketVerification">Verify Ticket</Link>
            <Link to="/deleteaccount">Delete Account</Link>

          </>
        ) : role === 'provider' ? (
          <>
            <Link to="/providerhome">Home</Link>
            <Link to="/addTravelOption">Add Option</Link>
            <Link to="/providerTravelOptions">My Options</Link>
            <Link to="/updateProvider">Update Profile</Link>
            <Link to="/ticketVerification">Verify Ticket</Link>
            <Link to="/deleteaccount">Delete Account</Link>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;




