// Import necessary libraries
require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const router = express.Router()
const auth = require('./utils/auth')
const app = express();
const Class = require('./models/Class'); // Ensure you have created the Class model
const Admin = require('./models/Admin'); // Ensure this model exists and is correctly set up

const MONGO_URI = process.env['MONGO_URI']

// console.log(MONGO_URI)

// For MongoDB connection
mongoose.connect(MONGO_URI).then(() => console.log('MongoDB connected successfully.'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
  );

// Use Express built-in body parser
app.use(express.json());
app.use(cors());
app.use('/api', router)

// ROUTES
// Define the GET endpoint for / route
router.get('/', (req, res) => {
  res.send('Hello World!');
});

// Define the GET endpoint for fetching classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find({});
    res.json(classes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username, password);

    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      console.log('Admin not found:', username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await auth.comparePassword(password, admin.password);
    if (isMatch) {
      // Generate a connection hash
      const expiresInDays = 1; // or however long you want the hash to be valid
      const connectionHash = await auth.hash(username, password, expiresInDays);
      res.status(200).json({ connectionHash });
    } else {
      console.log('Password mismatch for:', username);
      return res.status(401).json({ message: "Invalid credentials" });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Define the POST endpoint for creating a new class
router.post('/classes', async (req, res) => {
  console.log(`Received key: ${req.body.key}`);

  if (!auth.authenticate(req.body.key)) {
    return res.status(401).json("forbidden");
  }

  try {
    const newClass = new Class(req.body);
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});