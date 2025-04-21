import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const RateProvider = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticketId } = location.state || {}; 
  const [rating, setRating] = useState(5);
  const { updateUserDetails } = useAuth();

  useEffect(() => {
    if (!ticketId) {
      alert("Invalid ticket details. Please try again.");
      navigate('/myTickets');
    }
  }, [ticketId, navigate]);

  const handleRate = async () => {
    try {
      const currentTimestamp = new Date().toISOString();
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        alert("User email not found. Please log in again.");
        return;
      }
      
      await api.post(`/rateprovider?email=${encodeURIComponent(userEmail)}`, { ticketId, rating, currentTimestamp });
      alert("Provider rated successfully!");
      await updateUserDetails(userEmail);
      navigate('/myTickets');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Error rating provider, cannot rate before travel time!");
    }
  };

  return (
    <div className="container rate-provider">
      <h2>Rate Provider</h2>
      <div className="inputDiv">
        <label>Rating (1-5):</label><br />
        <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="inputField" /><br />
        <button className="btn" onClick={handleRate}>Submit Rating</button>
      </div>
      <button className="btn" onClick={() => navigate('/myTickets')}>Back to My Tickets</button>
    </div>
  );
};

export default RateProvider;

