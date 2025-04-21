import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [gstin, setGstin] = useState('');
  const [serviceProvider, setServiceProvider] = useState(''); // New state for Service Provider
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useAuth();
  const auth = getAuth(app);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryRole = params.get('role');
    if (!role && queryRole) {
      setRole(queryRole);
    }
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    setCaptchaQuestion(`What is ${a} + ${b}?`);
    setCaptchaAnswer((a + b).toString());
  }, [location.search, role, setRole]);

  const handleVerifyGstin = () => {
    if (gstin.trim().length === 15) {
      // Simple validation for GSTIN (length check)
      setIsGstinVerified(true);
    } else {
      alert('Invalid GSTIN. Please enter a valid 15-character GSTIN.');
    }
  };

  const handleSignUp = async () => {
    if (role === 'provider' && !isGstinVerified) {
      alert('Please verify your GSTIN before signing up.');
      return;
    }
    if (userCaptchaAnswer.trim() !== captchaAnswer) {
      setCaptchaError('Captcha answer is incorrect.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (role === 'user') {
        await api.post('/registercustomer', { name, contact, email });
      } else {
        await api.post('/registerprovider', { name, contact, rating: 5, email, serviceProvider });
      }
      navigate('/login?role=' + role + '&email=' + encodeURIComponent(email));
    } catch (error) {
      alert('Signup failed: ' + (error.response?.data || error.message));
    }
  };

  return (
    <div className="container">
      <h2>Sign Up as {role === 'user' ? 'Customer' : 'Provider'}</h2>
      <div className="inputDiv">
        <label>Name:</label>
        <br />
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="inputField" />
        <br />
        <label>Contact:</label>
        <br />
        <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} className="inputField" />
        <br />
        <label>Email:</label>
        <br />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="inputField" />
        <br />
        <label>Password:</label>
        <br />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="inputField" />
        <br />
        {role === 'provider' && (
          <div>
            <label>GSTIN:</label>
            <br />
            <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className="inputField" />
            <button onClick={handleVerifyGstin}>Verify</button>
            {isGstinVerified && <p style={{ color: 'green', fontWeight: 'bold' }}>Verified!</p>}
            <br />
            <label>Service Provider:</label>
            <br />
            <input
              type="text"
              value={serviceProvider}
              onChange={(e) => setServiceProvider(e.target.value)}
              className="inputField"
            />
            <br />
          </div>
        )}
        <label>{captchaQuestion} (Captcha):</label>
        <br />
        <input
          type="text"
          value={userCaptchaAnswer}
          onChange={(e) => {
            setUserCaptchaAnswer(e.target.value);
            setCaptchaError('');
          }}
          className="inputField"
        />
        <br />
        {captchaError && <p style={{ color: 'red' }}>{captchaError}</p>}
        <button className="btn" onClick={handleSignUp}>Sign Up</button>
      </div>
    </div>
  );
};

export default SignUp;



