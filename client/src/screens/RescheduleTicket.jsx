// src/screens/RescheduleTicket.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const RescheduleTicket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Expect the old ticket to be passed via location.state
  const { oldTicket } = location.state || {};

  // Guard: if no ticket data, navigate back.
  useEffect(() => {
    if (!oldTicket || !oldTicket.travelOptionId) {
      alert('No ticket data available for rescheduling');
      navigate(-1);
    }
  }, [oldTicket, navigate]);

  const [options, setOptions] = useState([]);

  // Fetch alternative travel options based on the source, destination, and departure date extracted from the travelOptionId.
  useEffect(() => {
    if (oldTicket && oldTicket.travelOptionId) {
      // Assume travelOptionId format: "source_destination_departureDate_departureTime_providerId_timestamp"
      const parts = oldTicket.travelOptionId.split('_');
      if (parts.length < 4) {
        alert('Invalid travel option id format');
        navigate(-1);
        return;
      }
      const source = parts[0];
      const destination = parts[1];
      console.log(source, destination);
      const fetchOptions = async () => {
        try {
          const res = await api.get('/listtraveloptionssorted1', { 
            params: { 
              source, 
              destination,
              sortBy: 'price'
            } 
          });
          // Exclude the travel option that matches the old ticket.
          const filteredOptions = res.data.filter(option => option.travelOptionId !== oldTicket.travelOptionId);
          setOptions(filteredOptions);
        } catch (error) {
          console.error("Error fetching travel options:", error.response?.data || error.message);
        }
      };

      fetchOptions();
    }
  }, [oldTicket, navigate]);

  // When the user clicks "Reschedule to this Option", navigate to RescheduleSeatSelection page.
  const handleReschedule = (newTravelOption) => {
    navigate('/reschedule-seat-selection', { state: { oldTicket, newTravelOption } });
  };

  return (
    <div className="reschedule-ticket" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Reschedule Ticket</h2>
      {options.length > 0 ? (
        <table style={{ margin: '0 auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Departure</th>
              <th>Mode</th>
              <th>Price</th>
              <th>Available Seats</th>
              <th>Service Provider</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {options.map(option => (
              <tr key={option.travelOptionId}>
                <td>{option.source}</td>
                <td>{option.destination}</td>
                <td>{option.departureDate} {option.departureTime}</td>
                <td>{option.transportMode}</td>
                <td>{option.basePrice}</td>
                <td>{option.availableSeats} / {option.seatCapacity}</td>
                <td>{option.serviceProvider}</td>
                <td>
                  <button className="btn" onClick={() => handleReschedule(option)}>
                    Reschedule to this Option
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No alternative travel options found.</p>
      )}
      <button className="btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default RescheduleTicket;

