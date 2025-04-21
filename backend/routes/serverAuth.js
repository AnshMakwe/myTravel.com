'use strict';
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { admin, db } = require('../firebase'); 






const router = express.Router();

// Enable CORS and JSON parsing for our router.
router.use(cors({ origin: '*' }));
router.use(express.json());

// Helper function to create a new user record in Firestore.
async function createUser(role, { name, email, phone, password }) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  // Use Firestore collection based on role.
  const user = { name, email, phone, password: hashedPassword };
  await db.collection(role).doc(email).set(user);
  return user;
}

// -------------------
// Customer Endpoints
// -------------------

// Signup endpoint for customers.
router.post('/signup/customer', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const userDoc = await db.collection('customer').doc(email).get();
    if (userDoc.exists) {
      return res.status(400).json({ error: 'Customer already exists' });
    }
    const user = await createUser('customer', { name, email, phone, password });
    return res.json({ message: 'Customer signed up successfully', user });
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

// Login endpoint for customers.
router.post('/login/customer', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const userDoc = await db.collection('customer').doc(email).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'Customer not found' });
    }
    const user = userDoc.data();
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    return res.json({ message: 'Customer login successful', user });
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

// -------------------
// Provider Endpoints
// -------------------

// Signup endpoint for providers.
router.post('/signup/provider', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const userDoc = await db.collection('provider').doc(email).get();
    if (userDoc.exists) {
      return res.status(400).json({ error: 'Provider already exists' });
    }
    const user = await createUser('provider', { name, email, phone, password });
    return res.json({ message: 'Provider signed up successfully', user });
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

// Login endpoint for providers.
router.post('/login/provider', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const userDoc = await db.collection('provider').doc(email).get();
    if (!userDoc.exists) {
      return res.status(400).json({ error: 'Provider not found' });
    }
    const user = userDoc.data();
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    return res.json({ message: 'Provider login successful', user });
  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;



