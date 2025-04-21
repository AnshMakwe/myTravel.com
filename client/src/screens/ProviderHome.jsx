import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProviderHome = () => {
  const navigate = useNavigate();
  const { userDetails: providerDetails, updateUserDetails, role } = useAuth();

  useEffect(() => {
    const providerEmail = localStorage.getItem('providerEmail');
    if (role === 'provider' && providerEmail) {
      updateUserDetails(providerEmail);
    }
  }, [role, updateUserDetails]);

  const handleUpdateProfile = () => {
    navigate('/updateProvider');
  };

  return (
    <div className="container provider-home">
      {providerDetails ? (
        <div className="provider-dashboard">
          <h2>Welcome, {providerDetails.name}</h2>
          <p><b>Balance:</b> {providerDetails.balance}</p>
          <p><b>Your Rating:</b> {providerDetails.rating}</p>
          <p><b>Total number of customers rated:</b> {providerDetails.numRatings}</p>
          <div className="provider-actions">
            <button className="btn" onClick={() => navigate('/addTravelOption')}>
              Add Travel Option
            </button>
            <button className="btn" onClick={() => navigate('/providerTravelOptions')}>
              View My Options
            </button>
            <button className="btn" onClick={handleUpdateProfile}>
              Update Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="inputDiv">
          <h2>Provider Not Registered</h2>
          <p>Please sign up from the registration page.</p>
          <button className="btn" onClick={() => navigate('/signup?role=provider')}>
            Go to Sign Up
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderHome;




