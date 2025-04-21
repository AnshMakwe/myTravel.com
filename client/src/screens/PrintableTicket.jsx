import React, { useRef } from 'react';
import QRCode from 'qrcode';
import { useLocation, useNavigate } from 'react-router-dom';

const PrintableTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket } = location.state || {};
  const qrRef = useRef(null);

  if (!ticket) {
    return <div>No ticket data available.</div>;
  }

  // Constructing the exact QR code string with actual null characters
  const qrData = ticket.ticketId;
  console.log("QR Data (encoded key):", qrData);
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = async () => {
    try {
      const qrCanvas = await QRCode.toCanvas(qrData, { errorCorrectionLevel: 'L' });
      const pngUrl = qrCanvas.toDataURL('image/png');

      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `ticket-${ticket.ticketId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  };

  return (
    <div className="printable-ticket">
      <h2>Printable Ticket</h2>
      <div className="ticket-details">
        
        <p><strong>Seat Number:</strong> {ticket.seatNumber}</p>
        <p><strong>Booking Time:</strong> {ticket.bookingTime}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        {ticket.pricingBreakdown && (
          <>
            <p><strong>Base Price:</strong> {ticket.pricingBreakdown.basePrice}</p>
            <p><strong>Occupancy Factor:</strong> {ticket.pricingBreakdown.occupancyFactor}</p>
            <p><strong>Dynamic Factor:</strong> {ticket.pricingBreakdown.dynamicFactor}</p>
            <p><strong>Dynamic Price:</strong> {ticket.pricingBreakdown.dynamicPrice}</p>
          </>
        )}
      </div>
      <div className="qr-code" ref={qrRef}>
        <canvas id="qrcode"></canvas>
      </div>
      <button className="btn" onClick={handlePrint}>Print Ticket</button>
      <button className="btn" onClick={handleDownloadQR}>Download QR Code</button>
      <button className="btn" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
};

export default PrintableTicket;

