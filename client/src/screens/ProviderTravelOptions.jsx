import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ProviderTravelOptions = () => {
    const [options, setOptions] = useState([]);
    const navigate = useNavigate();

    const fetchOptions = useCallback(async () => {
        try {
            const providerEmail = localStorage.getItem('providerEmail');
            if (!providerEmail) {
                console.error("No provider email found.");
                return;
            }

            const res = await api.get('/getprovidertraveloptions', {
                params: { email: providerEmail }
            });
            
            const filteredOptions = res.data.filter(option => option.status !== 'CANCELLED');
            setOptions(filteredOptions);
        } catch (error) {
            console.error('Error fetching travel options:', error.response?.data || error.message);
        }
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    const handleCancelListing = async (travelOptionId) => {
        try {
            const providerEmail = localStorage.getItem('providerEmail');
            if (!providerEmail) {
                alert("Provider email not found. Please log in again.");
                return;
            }

            await api.post('/canceltravellisting', { travelOptionId, providerEmail });
            alert("Travel listing cancelled and refunds processed.");
            fetchOptions();
        } catch (error) {
            console.error('Cancel listing error:', error.response?.data || error.message);
            alert("Error cancelling travel listing");
        }
    };

    return (
        <div className="provider-travel-options">
            <h2>My Travel Options</h2>
            {options.length > 0 ? (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>Destination</th>
                            <th>Departure</th>
                            <th>Mode</th>
                            <th>Service Provider</th>
                            <th>Available Seats</th>
                            <th>Base Price</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map(option => (
                            <tr key={option.travelOptionId}>
                                <td>{option.source}</td>
                                <td>{option.destination}</td>
                                <td>{`${option.departureDate} ${option.departureTime}`}</td>
                                <td>{option.transportMode}</td>
                                <td>{option.serviceProvider}</td>
                                <td>{`${option.availableSeats} / ${option.seatCapacity}`}</td>
                                <td>{option.basePrice}</td>
                                <td>{option.status}</td>
                                <td>
                                    <button
                                        className="btn"
                                        onClick={() => handleCancelListing(option.travelOptionId)}
                                    >
                                        Cancel Listing
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No travel options found.</p>
            )}
            <div className="button-group">
                <button className="btn" onClick={() => navigate('/providerhome')}>
                    Back to Provider Home
                </button>
            </div>
        </div>
    );
};

export default ProviderTravelOptions;

