// src/screens/RoleSelection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = ({ enrollAndRegister, onRoleSelect }) => {
  const navigate = useNavigate();

  const handleInitialize = () => {
    enrollAndRegister();
  };

  const handleUser = () => {
    onRoleSelect('user');
  };

  const handleProvider = () => {
    onRoleSelect('provider');
  };

  return (
    <div className="role-selection">
      <h1>Welcome to MyTravel.com</h1>
      <div className="role-buttons">
        <button className="btn" onClick={handleInitialize}>Initialize System</button>
        <button className="btn" onClick={handleUser}>Go in as User</button>
        <button className="btn" onClick={handleProvider}>Go in as Provider</button>
      </div>
    </div>
  );
};

export default RoleSelection;




