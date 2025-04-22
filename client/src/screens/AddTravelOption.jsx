// src/screens/AddTravelOption.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const AddTravelOption = () => {
  const navigate = useNavigate();
  const [option, setOption] = useState({
    source: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    transportMode: '',
    seatCapacity: '',
    basePrice: ''
  });

  const handleChange = (e) => {
    setOption({ ...option, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      // Retrieve provider's email from localStorage.
      const providerEmail = localStorage.getItem('providerEmail');
      if (!providerEmail) {
        alert("Provider email not found. Please log in as a provider.");
        return;
      }
      // Include providerEmail in the payload
      const payload = { ...option, providerEmail };
      const res = await api.post('/addtraveloption', payload);
      console.log(res.data);
      alert("Travel option added successfully!");
      navigate('/providerTravelOptions');
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data);
    }
  };

  return (
    <div className="add-travel-option" style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Add Travel Option</h2>
      <h3>Disclaimer: 5rs will be charged on adding each travel options as a platform fees!</h3>
      <div className="inputDiv" style={{ display: 'inline-block', textAlign: 'left', margin: '1rem' }}>
        <label>Source:</label><br />
        <input type="text" name="source" value={option.source} onChange={handleChange} /><br />
        <label>Destination:</label><br />
        <input type="text" name="destination" value={option.destination} onChange={handleChange} /><br />
        <label>Departure Date:</label><br />
        <input type="date" name="departureDate" value={option.departureDate} onChange={handleChange} /><br />
        <label>Departure Time:</label><br />
        <input type="time" name="departureTime" value={option.departureTime} onChange={handleChange} /><br />
        <label>Transport Mode:</label><br />
        <input type="text" name="transportMode" value={option.transportMode} onChange={handleChange} placeholder="e.g., train, bus, plane" /><br />
        <label>Seat Capacity:</label><br />
        <input type="number" name="seatCapacity" value={option.seatCapacity} onChange={handleChange} /><br />
        <label>Base Price:</label><br />
        <input type="number" name="basePrice" value={option.basePrice} onChange={handleChange} /><br />
        <button className="btn" onClick={handleSubmit}>Add Option</button>
      </div>
      <button className="btn" onClick={() => navigate('/providerTravelOptions')}>Back to My Travel Options</button>
    </div>
  );
};

export default AddTravelOption;




