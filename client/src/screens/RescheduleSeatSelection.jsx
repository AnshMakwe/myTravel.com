// src/screens/RescheduleSeatSelection.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const RescheduleSeatSelection = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  // Destructure from state (using empty object as fallback)
  const { oldTicket, newTravelOption } = state || {};

  // Declare hooks unconditionally.
  const [selectedSeat, setSelectedSeat] = useState(null);
  
  // If newTravelOption is missing, we default seatCapacity to 0 (this hook is called always)
  const seatCapacity = newTravelOption ? newTravelOption.seatCapacity : 0;
  const cols = 10; // fixed 10 columns
  
  // Create an array of seat numbers from 1 to seatCapacity.
  const seats = Array.from({ length: seatCapacity }, (_, i) => i + 1);
  
  // Check if required state exists.
  useEffect(() => {
    if (!oldTicket || !newTravelOption) {
      alert('Reschedule data missing.');
      navigate(-1);
    }
  }, [oldTicket, newTravelOption, navigate]);

  // If newTravelOption is still missing, render a message.
  if (!newTravelOption) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Reschedule data missing. Please go back and try again.</p>
      </div>
    );
  }

  const handleSeatClick = (seatNumber) => {
    // Check using newTravelOption.bookedSeats (if it exists)
    const isBooked = newTravelOption.bookedSeats && newTravelOption.bookedSeats.includes(seatNumber);
    if (isBooked) {
      alert(`Seat ${seatNumber} is already booked.`);
      return;
    }
    setSelectedSeat(seatNumber);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSeat) {
      alert('Please select a seat first.');
      return;
    }
    try {
      const currentTimestamp = new Date().toISOString();
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("User email not found. Please log in again.");
        return;
      }
      // Prepare payload for rescheduling.
      console.log(currentTimestamp);
      const payload = {
        ticketId: oldTicket.ticketId,
        newTravelOptionId: newTravelOption.travelOptionId,
        currentTimestamp,
        identityEmail: userEmail,
        selectedSeat  // Pass the selected seat to your chaincode.
      };
      const res = await api.post('/rescheduleticket', payload);
      alert("Ticket rescheduled successfully!");
      navigate('/myTickets');
    } catch (error) {
      console.error("Error rescheduling ticket:", error.response?.data || error.message);
      alert("Error rescheduling ticket");
    }
  };

  // Simple inline style for each seat cell.
  const seatStyle = (seatNumber) => {
    const isBooked = newTravelOption.bookedSeats && newTravelOption.bookedSeats.includes(seatNumber);
    const isSelected = selectedSeat === seatNumber;
    return {
      width: '40px',
      height: '40px',
      margin: '5px',
      backgroundColor: isBooked ? '#ff4d4d' : (isSelected ? '#4dff4d' : '#4CAF50'),
      color: '#fff',
      lineHeight: '40px',
      textAlign: 'center',
      cursor: isBooked ? 'not-allowed' : 'pointer',
      border: isSelected ? '3px solid #000' : '1px solid #333',
      borderRadius: '4px'
    };
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Reschedule Your Ticket</h2>
      <p>
        New Travel Option: {newTravelOption.source} to {newTravelOption.destination}<br />
        Departure: {newTravelOption.departureDate} at {newTravelOption.departureTime}
      </p>
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 50px)', // Fixed layout: 10 columns
          justifyContent: 'center',
          gap: '5px'
        }}>
        {seats.map(seatNumber => (
          <div 
            key={seatNumber}
            style={seatStyle(seatNumber)}
            onClick={() => handleSeatClick(seatNumber)}>
            {seatNumber}
          </div>
        ))}
      </div>
      {selectedSeat && <p>Selected Seat: {selectedSeat}</p>}
      <button className="btn" onClick={handleConfirmReschedule}>Confirm Reschedule</button>
      <br />
      <button className="btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default RescheduleSeatSelection;



