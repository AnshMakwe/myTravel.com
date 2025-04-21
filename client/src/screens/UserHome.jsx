// src/screens/UserHome.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserHome = () => {
  const navigate = useNavigate();
  const { userDetails, updateUserDetails, status, role } = useAuth();
  
  
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (role === 'user' && userEmail) {
      updateUserDetails(userEmail);
    }
  }, [role, updateUserDetails]);


  const handleDeposit = () => {
    navigate('/depositFunds');
  };

  const handleUpdateProfile = () => {
    navigate('/updateCustomer');
  };

  return (
    <div className="container user-home">
      {userDetails ? (
        <div className="user-dashboard">
          <h2>Welcome, {userDetails.name}</h2>
          <p><b>Balance:</b> {userDetails.balance}</p>
          <div className="actions">
            <button className="btn" onClick={() => navigate('/searchTravel')}>Search Travel Options</button>
            <button className="btn" onClick={() => navigate('/myTickets')}>My Tickets</button>
            <button className="btn" onClick={handleDeposit}>Deposit Funds</button>
            <button className="btn" onClick={handleUpdateProfile}>Update Profile</button>
          </div>
        </div>
      ) : (
        <div className="inputDiv">
          <h2>User Not Registered</h2>
          <p>Please sign up from the registration page.</p>
          <button className="btn" onClick={() => navigate('/signup?role=user')}>Go to Sign Up</button>
        </div>
      )}
    </div>
  );
};

export default UserHome;




