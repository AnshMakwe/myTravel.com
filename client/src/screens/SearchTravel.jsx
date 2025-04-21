import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const SearchTravel = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  // Use departureDate to capture user input for date,
  // but send it under the key inputdate in the API request.
  const [departureDate, setDepartureDate] = useState(''); 
  const [sortBy, setSortBy] = useState('price');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterProviderId, setFilterProviderId] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [travelOptions, setTravelOptions] = useState([]);
  const navigate = useNavigate();
  const { updateUserDetails } = useAuth();
  
  

  const handleSearch = async () => {
    try {
      const response = await api.get('/listtraveloptionssorted', {
        // Change departureDate key to "inputdate" to match backend expectation.
        params: { 
          source, 
          destination,
          inputdate: departureDate, 
          sortBy, 
          minPrice, 
          maxPrice, 
          filterProviderId, 
          onlyAvailable 
        }
      });
      
      // Filter out any cancelled travel options.
      const filteredOptions = response.data.filter(option => option.status !== 'CANCELLED');
      setTravelOptions(filteredOptions);
    } catch (error) {
      console.error('Error searching travel options:', error.response?.data || error.message);
    }
  };

  // Instead of booking the ticket directly, navigate to the SeatSelection page.
  const handleBook = (option) => {
    // It is assumed that the option object may contain bookedSeats; if not, we default to an empty array.
    const bookedSeats = option.bookedSeats || [];
    navigate('/seatselection', { state: { travelOption: option, bookedSeats } });
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Search Travel Options</h2>
      <h3>Disclaimer: Extra 5rs will be charged on each ticket as a platform fees!</h3>
      <div className="inputDiv" style={{ display: 'inline-block', textAlign: 'left' }}>
        <label htmlFor="source">Source:</label><br />
        <input 
          type="text" 
          id="source" 
          value={source} 
          onChange={(e) => setSource(e.target.value)} 
        /><br />
        <label htmlFor="destination">Destination:</label><br />
        <input 
          type="text" 
          id="destination" 
          value={destination} 
          onChange={(e) => setDestination(e.target.value)} 
        /><br />
        <label htmlFor="departureDate">*Departure Date:</label><br />
        <input
          type="date"
          id="departureDate"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
        /><br />
        <label htmlFor="sortBy">Sort By:</label><br />
        <select 
          id="sortBy" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="price">Price</option>
          <option value="rating">Provider Rating</option>
          <option value="transportMode">Transport Mode</option>
        </select><br />
        <label htmlFor="minPrice">Min Price:</label><br />
        <input 
          type="number" 
          id="minPrice" 
          value={minPrice} 
          onChange={(e) => setMinPrice(e.target.value)} 
        /><br />
        <label htmlFor="maxPrice">Max Price:</label><br />
        <input 
          type="number" 
          id="maxPrice" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(e.target.value)} 
        /><br />
        <label htmlFor="filterProviderId">Service Provider:</label><br />
        <input
          type="text"
          id="filterProviderId"
          value={filterProviderId}
          onChange={(e) => setFilterProviderId(e.target.value)}
          placeholder="Enter Service Provider"
        /><br />
        <label htmlFor="onlyAvailable">Only Available:</label>
        <input
          type="checkbox"
          id="onlyAvailable"
          checked={onlyAvailable}
          onChange={(e) => setOnlyAvailable(e.target.checked)}
        /><br />
        <button className="btn" onClick={handleSearch}>Search</button>
      </div>
      {travelOptions && travelOptions.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Departure</th>
              <th>Mode</th>
              <th>Price</th>
              <th>Available Seats</th>
              <th>Service Provider</th>
              <th>Rating</th>
              <th>Total Ratings</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {travelOptions.map(option => (
              <tr key={option.travelOptionId}>
                <td>{option.source}</td>
                <td>{option.destination}</td>
                <td>{option.departureDate} {option.departureTime}</td>
                <td>{option.transportMode}</td>
                <td>{option.basePrice}</td>
                <td>{option.availableSeats} / {option.seatCapacity}</td>
                
                <td>{option.serviceProvider}</td>
                <td>{option.providerRating}</td>
                <td>{option.totalRating}</td>
                <td>
                  <button className="btn" onClick={() => handleBook(option)}>
                    Book Ticket
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No travel options found.</p>
      )}

      <button className="btn" onClick={() => navigate('/userhome')}>Back to Home</button>
    </div>
  );
};

export default SearchTravel;




