// src/screens/MyTickets.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();
  const { updateUserDetails } = useAuth();

  const fetchTickets = async () => {
    try {
      const response = await api.get('/getcustomertickets', { params: { email: localStorage.getItem('userEmail') } });
      setTickets(response.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCancel = async (ticketId) => {
    try {
      const currentTimestamp = new Date().toISOString();
      // Retrieve the user email from localStorage
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("User email not found. Please log in again.");
        return;
      }
      // Pass the email as a query parameter (or in the body)
      await api.post(`/cancelticket?email=${encodeURIComponent(userEmail)}`, { ticketId, currentTimestamp });
      await updateUserDetails(userEmail);
      fetchTickets();
      alert("Ticket cancelled successfully");
    } catch (error) {
      alert("Error cancelling ticket: " + (error.response?.data || error.message));
    }
  };

  // Updated: pass the entire ticket object instead of ticketId
  const handleReschedule = (ticket) => {
    navigate('/rescheduleticket', { state: { oldTicket: ticket } });
  };

  const handleRate = (ticketId) => {
    navigate('/rateprovider', { state: { ticketId } });
  };

  const handlePrint = (ticket) => {
    navigate('/printableTicket', { state: { ticket } });
  };

  return (
    <div className="container">
      <h2>My Tickets</h2>
      {tickets && tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div key={ticket.ticketId} className="detailsDiv">
            <p><b>Seat Number:</b> {ticket.seatNumber}</p>
            <p><b>Booking Time:</b> {ticket.bookingTime}</p>
            <p><b>Status:</b> {ticket.status}</p>
            {(ticket.status === 'CONFIRMED' || ticket.status === 'PENDING_CONFIRMATION') && (
              <div>
                <button className="btn" onClick={() => handleCancel(ticket.ticketId)}>Cancel Ticket</button>
                {/* Pass the full ticket object to handleReschedule */}
                <button className="btn" onClick={() => handleReschedule(ticket)}>Reschedule Ticket</button>
              </div>
            )}
            {ticket.status === 'CONFIRMED' && new Date(ticket.bookingTime) < new Date() && (
              <button className="btn" onClick={() => handleRate(ticket.ticketId)}>Rate Provider</button>
            )}
            {ticket.status === 'CONFIRMED' && (
              <button className="btn" onClick={() => handlePrint(ticket)}>Print Ticket</button>
            )}
          </div>
        ))
      ) : (
        <p>No tickets booked yet.</p>
      )}
      <button className="btn" onClick={() => navigate('/userhome')}>Back to Home</button>
    </div>
  );
};

export default MyTickets;




