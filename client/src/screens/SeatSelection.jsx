// src/SeatSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const SeatSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract travelOption and bookedSeats from location.state.
  const { travelOption, bookedSeats = [] } = location.state || {};

  // Declare hooks unconditionally.
  const [selectedSeat, setSelectedSeat] = useState(null);

  // If travelOption is not provided, use an effect to alert and navigate back.
  useEffect(() => {
    if (!travelOption) {
      alert('No travel option details provided.');
      navigate(-1);
    }
  }, [travelOption, navigate]);

  // If travelOption is not available, render nothing.
  if (!travelOption) return null;

  const seatCapacity = travelOption.seatCapacity;
  // Fixed grid: 10 columns per row.
  const cols = 10;
  const rows = Math.ceil(seatCapacity / 10);

  // Create an array representing all seat numbers (from 1 to seatCapacity).
  const seatsArray = Array.from({ length: seatCapacity }, (_, i) => i + 1);

  const handleSeatClick = (seatNum) => {
    if (bookedSeats.includes(seatNum)) {
      alert(`Seat ${seatNum} is already booked.`);
      return;
    }
    setSelectedSeat(seatNum);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeat) {
      alert('Please select a seat first.');
      return;
    }
    try {
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("User email not found. Please log in again.");
        return;
      }
      const response = await api.post(
        `/bookticket?email=${encodeURIComponent(userEmail)}`,
        { travelOptionId: travelOption.travelOptionId, seatnumber: selectedSeat }
      );
      alert('Ticket booked successfully!');
      navigate('/myTickets');
    } catch (error) {
      console.error('Booking error:', error.response?.data || error.message);
      alert('Error booking ticket.');
    }
  };

  // Simple inline style for each seat cell.
  const seatStyle = (seatNum) => {
    const isBooked = bookedSeats.includes(seatNum);
    const isSelected = selectedSeat === seatNum;
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
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Select Your Seat</h2>
      <p>
        Travel Option: {travelOption.source} to {travelOption.destination} on {travelOption.departureDate} {travelOption.departureTime}
      </p>
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 50px)', // Fixed 10 columns
          justifyContent: 'center',
          gap: '5px',
          marginBottom: '20px'
        }}>
        {seatsArray.map((seatNum) => (
          <div
            key={seatNum}
            style={seatStyle(seatNum)}
            onClick={() => handleSeatClick(seatNum)}
          >
            {seatNum}
          </div>
        ))}
      </div>
      {selectedSeat && <p>Selected Seat: {selectedSeat}</p>}
      <button className="btn" onClick={handleConfirmBooking}>Confirm Booking</button>
      <br />
      <button className="btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default SeatSelection;




