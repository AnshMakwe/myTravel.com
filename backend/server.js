'use strict';
require('dotenv').config();





const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { admin, db } = require('./firebase'); 




const enrollAdmin = require('../sdk/javascript/enrollAdmin');
// const enrollAdminOrg2 = require('../sdk/javascript/enrollAdminOrg2');
const getCustomerDetails = require('../sdk/javascript/getCustomerDetails');
const getProviderDetails = require('../sdk/javascript/getProviderDetails');
const depositFunds = require('../sdk/javascript/serverDepositFunds');
const getCustomerTickets = require('../sdk/javascript/serverGetCustomerTickets');
const getProviderTravelOptions = require('../sdk/javascript/serverGetProviderTravelOptions');
const getTicketDetails = require('../sdk/javascript/serverGetTicketDetails');
const listTravelOptions = require('../sdk/javascript/serverListTravelOptions');
const listTravelOptionsSorted = require('../sdk/javascript/serverListTravelOptionsSorted');
const rateProvider = require('../sdk/javascript/serverRateProvider');
const registerUser = require('../sdk/javascript/registerUser');
// const registerUserOrg2 = require('../sdk/javascript/registerUserOrg2');
const addTravelOption = require('../sdk/javascript/serverAddTravelOption');
const registerCustomerDynamic = require('../sdk/javascript/serverRegisterCustomerDynamic');
const registerProviderDynamic = require('../sdk/javascript/serverRegisterProviderDynamic');
const bookTicket = require('../sdk/javascript/serverBookTicket');
const cancelTicket = require('../sdk/javascript/serverCancelTicket');
const rescheduleTicket = require('../sdk/javascript/serverRescheduleTicket');
const cancelTravelListing = require('../sdk/javascript/serverCancelTravelListing');
const updateCustomerDetails = require('../sdk/javascript/serverUpdateCustomerDetails');
const confirmTicket = require('../sdk/javascript/serverConfirmTicket');
const updateProviderDetails = require('../sdk/javascript/serverUpdateProviderDetails');
const deleteTravelOption = require('../sdk/javascript/serverDeleteTravelOption');

const listTravelOptionsSorted1 = require('../sdk/javascript/serverListTravelOptionsSorted1');


const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors({ origin: '*' }));


const authRouter = require('./routes/serverAuth');
app.use('/auth', authRouter);




app.get('/enrollall', async (req, res) => {
  try {
    console.log("Enroll all identities");
    await enrollAdmin();
    // await enrollAdminOrg2();
    await registerUser();
    // await registerUserOrg2();
    res.send({ success: true });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});




app.post('/registercustomer', async (req, res) => {
  try {
    const { name, contact, email } = req.body;
    if (!name || !contact || !email) {
      return res.status(400).send('Missing required fields: name, contact, and email');
    }
    console.log(`Registering customer with email: ${email}`);
    const ret = await registerCustomerDynamic({ enrollmentID: email, name, contact });
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/updatecustomerdetails', async (req, res) => {
  try {
    let { newName, newContact, isAnonymous } = req.body;
    isAnonymous = isAnonymous === true || isAnonymous === 'true'; // convert to boolean

    if (!newName) {
      return res.status(400).send('New name is required.');
    }
    if (!isAnonymous && !newContact) {
      return res.status(400).send('New contact is required when profile is not anonymous.');
    }
    // Expect the customer's email as a query parameter
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).send('Email parameter is required');
    }
    const ret = await updateCustomerDetails(newName, newContact, isAnonymous, userEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});



app.get('/getcustomerdetails', async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).send('Email parameter is required');
    }
    const ret = await getCustomerDetails(userEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/depositfunds', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).send('Amount is required.');
    }
    // Get identity from query parameter (or you could take it from the body)
    const identityEmail = req.query.email;
    if (!identityEmail) {
      return res.status(400).send('Email parameter is required for deposit.');
    }
    const ret = await depositFunds(amount, identityEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});





app.get('/getcustomertickets', async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).send('Email parameter is required');
    }
    const ret = await getCustomerTickets(userEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/bookticket', async (req, res) => {
  try {
    const { travelOptionId, seatnumber } = req.body;
    if (!travelOptionId) {
      return res.status(400).send('Travel option ID is required.');
    }
    // Get customer identity (email) from the request body or query parameter.
    const identityEmail = req.body.email || req.query.email;
    if (!identityEmail) {
      return res.status(400).send('Email parameter is required for booking.');
    }
    const ret = await bookTicket(travelOptionId, seatnumber,identityEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});







app.post('/cancelticket', async (req, res) => {
  try {
    const { ticketId, currentTimestamp } = req.body;
    if (!ticketId || !currentTimestamp) {
      return res.status(400).send('Ticket ID and current timestamp are required.');
    }
    // Get the customer identity from request body or query (e.g., localStorage value from the client)
    const identityEmail = req.body.email || req.query.email;
    if (!identityEmail) {
      return res.status(400).send('Email parameter is required for cancelling a ticket.');
    }
    const ret = await cancelTicket(ticketId, currentTimestamp, identityEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});






app.post('/rescheduleticket', async (req, res) => {
  try {
    // Expect old ticket's encoded key, new travel option ID, and current timestamp in the request body
    const { ticketId, newTravelOptionId, currentTimestamp,  identityEmail, selectedSeat} = req.body;
    if (!ticketId || !newTravelOptionId || !currentTimestamp) {
      return res.status(400).send('Missing required fields.');
    }
    const ret = await rescheduleTicket(ticketId, newTravelOptionId, currentTimestamp,identityEmail, selectedSeat);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});



app.get('/listtraveloptionssorted1', async (req, res) => {
  try {
    const { source, destination, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable } = req.query;
    if (!source || !destination || !sortBy) {
      return res.status(400).send('Source, destination, and sortBy are required.');
    }
    const ret = await listTravelOptionsSorted1(
      source,
      destination,
      sortBy,
      minPrice || "",
      maxPrice || "",
      filterProviderId || "",
      onlyAvailable ? onlyAvailable.toString() : ""
    );
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});









app.post('/confirmticket', async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).send('Ticket ID is required.');
    }
    const ret = await confirmTicket(ticketId);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});




app.post('/registerprovider', async (req, res) => {
  try {
    const { name, contact, rating, email, serviceProvider } = req.body;
    if (!name || !contact || rating === undefined || !email || !serviceProvider) {
      return res.status(400).send('Missing required fields: name, contact, rating, and email');
    }
    console.log(`Registering provider with email: ${email}`);
    const ret = await registerProviderDynamic({ enrollmentID: email, name, contact, rating, serviceProvider});
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/updateproviderdetails', async (req, res) => {
  try {
    const { providerEmail, newName, newContact, newRating, isAnonymous } = req.body;
    if (!providerEmail || !newName || (!isAnonymous && !newContact) || newRating === undefined) {
      return res.status(400).send('Missing required fields for provider update.');
    }
    console.log(`Updating provider details for ${providerEmail}: newName=${newName}, newContact=${newContact}, newRating=${newRating}, isAnonymous=${isAnonymous}`);
    const ret = await updateProviderDetails(providerEmail, newName, newContact, newRating, isAnonymous);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/addtraveloption', async (req, res) => {
  try {
    const { providerEmail, source, destination, departureDate, departureTime, transportMode, seatCapacity, basePrice } = req.body;
    if (!providerEmail || !source || !destination || !departureDate || !departureTime || !transportMode || !seatCapacity || !basePrice) {
      return res.status(400).send('Missing required fields for adding a travel option.');
    }
    console.log(`Adding travel option for provider ${providerEmail}: ${source} to ${destination}`);
    const ret = await addTravelOption(providerEmail, source, destination, departureDate, departureTime, transportMode, seatCapacity, basePrice);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.post('/deletetraveloption', async (req, res) => {
  try {
    const { travelOptionId } = req.body;
    if (!travelOptionId) {
      return res.status(400).send('Travel option ID is required.');
    }
    const ret = await deleteTravelOption(travelOptionId);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/canceltravellisting', async (req, res) => {
  try {
    const { travelOptionId, providerEmail } = req.body;
    if (!travelOptionId) {
      return res.status(400).send('Travel option ID is required.');
    }
    // Check for provider email in body first; if not, fallback to query parameter.
    const identityEmail = providerEmail || req.query.email;
    if (!identityEmail) {
      return res.status(400).send('Provider email is required for cancelling travel listing.');
    }
    const ret = await cancelTravelListing(travelOptionId, identityEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});






app.get('/getprovidertraveloptions', async (req, res) => {
  try {
    const providerEmail = req.query.email;
    if (!providerEmail) {
      return res.status(400).send('Provider email parameter is required');
    }
    const ret = await getProviderTravelOptions(providerEmail);
    res.json(JSON.parse(ret));
  } catch (error) {
    res.status(500).send(error.toString());
  }
});






app.get('/getproviderdetails', async (req, res) => {
  try {
    const providerEmail = req.query.email;
    if (!providerEmail) {
      return res.status(400).send('Provider email parameter is required');
    }
    const ret = await getProviderDetails(providerEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});




app.get('/listtraveloptions', async (req, res) => {
  try {
    const { source, destination } = req.query;
    if (!source || !destination) {
      return res.status(400).send('Source and destination are required.');
    }
    const ret = await listTravelOptions(source, destination);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.get('/listtraveloptionssorted', async (req, res) => {
  try {
    const { source, destination, inputdate, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable } = req.query;
    if (!source || !destination || !inputdate || !sortBy) {
      return res.status(400).send('Source, destination, inputdate, and sortBy are required.');
    }
    const ret = await listTravelOptionsSorted(
      source,
      destination,
      inputdate,
      sortBy,
      minPrice || "",
      maxPrice || "",
      filterProviderId || "",
      onlyAvailable ? onlyAvailable.toString() : ""
    );
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});










app.post('/rateprovider', async (req, res) => {
  try {
    const { ticketId, rating, currentTimestamp } = req.body;
    if (!ticketId || !rating || !currentTimestamp) {
      return res.status(400).send('Ticket ID, rating, and current timestamp are required.');
    }
    // Get customer identity (email) from body or query parameter.
    const identityEmail = req.body.email || req.query.email;
    if (!identityEmail) {
      return res.status(400).send('Email parameter is required for rating.');
    }
    const ret = await rateProvider(ticketId, rating, currentTimestamp, identityEmail);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


const deleteCustomer = require('../sdk/javascript/serverDeleteCustomer');
const deleteProvider = require('../sdk/javascript/serverDeleteProvider');


app.post('/deletecustomer', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('Customer email is required.');
    
    
    const chaincodeResult = await deleteCustomer(email);
    
    
    // Delete the customer document from Firestore.
    //await db.collection('customer').doc(email).delete();
    admin.auth().getUserByEmail(email).then((userRecord) => {
     
      const userId = userRecord.uid;
  
    
      return admin.auth().deleteUser(userId);
    }).then(() => {
      console.log("Successfully deleted user");
    }).catch((error) => {
      console.error("Error deleting user:", error);
    });
    
    console.log(`Customer identity ${email} removed from wallet.`);
  
    res.send({ chaincodeResult, message: 'Customer account deleted from blockchain and Firebase.' });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});






app.post('/deleteprovider', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send('Provider email is required.');
    
   
    const chaincodeResult = await deleteProvider(email);
    
   
    //await db.collection('provider').doc(email).delete();
    admin.auth().getUserByEmail(email).then((userRecord) => {
 
      const userId = userRecord.uid;
  
  
      return admin.auth().deleteUser(userId);
    }).then(() => {
      console.log("Successfully deleted user");
    }).catch((error) => {
      console.error("Error deleting user:", error);
    });
  
    res.send({ chaincodeResult, message: 'Provider account deleted from blockchain and Firebase.' });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


// Get ticket details (by ticketId as URL parameter)
app.get('/getticketdetails', async (req, res) => {
  try {
    const ticketId = req.query.ticketId; // This is the encoded key
    console.log('Received Ticket ID:', ticketId);
    if (!ticketId) {
      return res.status(400).send('Ticket ID is required.');
    }
    const ret = await getTicketDetails(ticketId);
    res.send(ret);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


const getAllTravelOptions = require('../sdk/javascript/serverGetAllTravelOptions');
const autoConfirmTickets = require('../sdk/javascript/serverAutoConfirmTickets');


const autoConfirmScheduler = require('./autoConfirmScheduler'); // Adjust the path if needed



app.get('/getalltraveloptions', async (req, res) => {
  try {
    const result = await getAllTravelOptions();
    res.send(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});


app.post('/autoConfirmTickets', async (req, res) => {
  try {
    const { travelOptionId, currentTimestamp, identityEmail } = req.body;
    if (!travelOptionId || !currentTimestamp || !identityEmail) {
      return res.status(400).send('Travel option ID, current timestamp, and identity email are required.');
    }
    const result = await autoConfirmTickets(travelOptionId, currentTimestamp, identityEmail);
    res.send(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});






app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);

  // Fork the auto-confirm scheduler in a separate process
  const { fork } = require('child_process');
  const schedulerPath = path.join(__dirname, 'autoConfirmScheduler.js');
  fork(schedulerPath, [], { stdio: 'inherit', cwd: process.cwd() });
  console.log('Auto-confirm scheduler started.');

});



