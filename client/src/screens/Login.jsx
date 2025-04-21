import React, { useState, useEffect } from 'react'; // <- Ensure useEffect is imported
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../config/firebaseConfig';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUserDetails, role, setRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const roleParam = query.get('role');
    if (roleParam) {
      setRole(roleParam);
    }
  }, [location.search, setRole]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem(role === 'user' ? 'userEmail' : 'providerEmail', email);
      await updateUserDetails(email);
      setLoading(false);
      navigate(role === 'user' ? '/userhome' : '/providerhome');
    } catch (error) {
      setLoading(false);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h2>Login as {role === 'user' ? 'Customer' : 'Provider'}</h2>
      <div className="inputDiv">
        <label>Email:</label>
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="inputField"
        />
        <br />
        <label>Password:</label>
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="inputField"
        />
        <br />
        <button className="btn" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
      <p>
        Don't have an account?{' '}
        <button className="link-btn" onClick={() => navigate('/signup?role=' + role)}>
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;




