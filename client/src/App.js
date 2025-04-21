// src/App.js
import './App.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from './api';
import { AuthProvider, useAuth } from './context/AuthContext';

import RoleSelection from './screens/RoleSelection';
import Login from './screens/Login';
import Signup from './screens/SignUp';
import UserHome from './screens/UserHome';
import ProviderHome from './screens/ProviderHome';
import SearchTravel from './screens/SearchTravel';
import MyTickets from './screens/MyTickets';
import DepositFunds from './screens/DepositFunds';
import AddTravelOption from './screens/AddTravelOption';
import ProviderTravelOptions from './screens/ProviderTravelOptions';
import RescheduleTicket from './screens/RescheduleTicket';
import RateProvider from './screens/RateProvider';
import PrintableTicket from './screens/PrintableTicket';
import TicketVerification from './screens/TicketVerification';
import UpdateCustomerDetails from './screens/UpdateCustomerDetails';
import UpdateProviderDetails from './screens/UpdateProviderDetails';
import DeleteAccount from './screens/DeleteAccount';

import RescheduleSeatSelection from './screens/RescheduleSeatSelection';

// Import your new SeatSelection component
import SeatSelection from './screens/SeatSelection';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const navigate = useNavigate();
  const { role, setRole, status, setStatus, org, setOrg, updateUserDetails } = useAuth();

  const enrollAndRegister = async () => {
    try {
      const res = await api.get('/enrollall');
      console.log('Enroll response:', res.data);
      setStatus(true);
    } catch (error) {
      console.error('Enrollment error:', error.response?.data || error.message);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'user') {
      setOrg('1'); // Customer: Org1
      navigate('/login?role=user');
    } else {
      setOrg('2'); // Provider: Org2
      navigate('/login?role=provider');
    }
  };

  return (
    <div className="App">
      {role && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <RoleSelection
              enrollAndRegister={enrollAndRegister}
              onRoleSelect={handleRoleSelect}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/userhome"
          element={
            <ProtectedRoute roleRequired="user">
              <UserHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/searchTravel"
          element={
            <ProtectedRoute roleRequired="user">
              <SearchTravel />
            </ProtectedRoute>
          }
        />
        {/* New SeatSelection route added */}
        <Route
          path="/seatselection"
          element={
            <ProtectedRoute roleRequired="user">
              <SeatSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/myTickets"
          element={
            <ProtectedRoute roleRequired="user">
              <MyTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/depositFunds"
          element={
            <ProtectedRoute roleRequired="user">
              <DepositFunds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rescheduleticket"
          element={
            <ProtectedRoute roleRequired="user">
              <RescheduleTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rateprovider"
          element={
            <ProtectedRoute roleRequired="user">
              <RateProvider />
            </ProtectedRoute>
          }
        />
        <Route
          path="/printableTicket"
          element={
            <ProtectedRoute roleRequired="user">
              <PrintableTicket />
            </ProtectedRoute>
          }
        />
        <Route path="/ticketVerification" element={<TicketVerification />} />
        <Route
          path="/updateCustomer"
          element={
            <ProtectedRoute roleRequired="user">
              <UpdateCustomerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/providerhome"
          element={
            <ProtectedRoute roleRequired="provider">
              <ProviderHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/updateProvider"
          element={
            <ProtectedRoute roleRequired="provider">
              <UpdateProviderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/addTravelOption"
          element={
            <ProtectedRoute roleRequired="provider">
              <AddTravelOption />
            </ProtectedRoute>
          }
        />
        <Route
          path="/providerTravelOptions"
          element={
            <ProtectedRoute roleRequired="provider">
              <ProviderTravelOptions />
            </ProtectedRoute>
          }
        />
        <Route path="/deleteaccount" element={<DeleteAccount />} />
        <Route
          path="/reschedule-seat-selection"
          element={
            <ProtectedRoute roleRequired="user">
              <RescheduleSeatSelection />
    </ProtectedRoute>
  }
/>

        
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;




