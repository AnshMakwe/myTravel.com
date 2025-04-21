import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import api from '../api';
const TicketVerification = () => {
  const [result, setResult] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const navigate = useNavigate();

  const handleQRUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => processQR(img);
    };
    reader.readAsDataURL(file);
  };

  const processQR = (img) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const qrCode = jsQR(imageData.data, img.width, img.height);
    // console.log(qrCode.data);
    if (qrCode) {
      const ticketId = qrCode.data.trim();
      console.log("Decoded Ticket ID:", ticketId);
      setResult(ticketId);
      verifyTicket(ticketId);
    } else {
      console.error("QR Code not detected");
      alert('Invalid QR Code');
    }
  };

  const verifyTicket = async (scannedTicketId) => {
  console.log("Scanned Ticket (encoded):", scannedTicketId);
  try {
    const response = await api.get(`/getticketdetails?ticketId=${encodeURIComponent(scannedTicketId)}`);
    const ticket = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    
    if (ticket && ticket.status === 'CONFIRMED') {
      setVerificationStatus('Ticket Verified');
      alert('Ticket Verified for the seat number: ' + ticket.seatNumber);
    } else {
      setVerificationStatus('Ticket Not Verified');
      alert('Ticket Not Verified');
    }
  } catch (err) {
    console.error("API Error:", err);
    setVerificationStatus('Ticket Not Found or Error Occurred');
    alert('Ticket Not Found or Error Occurred');
  }
};













  return (
    <div className="ticket-verification">
      <h2>Ticket Verification</h2>
      <input type="file" accept="image/png, image/jpeg" onChange={handleQRUpload} />
      {verificationStatus && <p>{verificationStatus}</p>}
      <button className="btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default TicketVerification;

