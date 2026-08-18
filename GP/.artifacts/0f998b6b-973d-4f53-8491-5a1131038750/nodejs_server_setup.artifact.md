# Node.js Express Backend Setup

To connect your Flutter app to a Node.js backend, you can use this simple Express server as a starting point.

## 1. Initialize the project
Run these commands in a new directory (outside your Flutter project):
```bash
mkdir xenon-backend
cd xenon-backend
npm init -y
npm install express cors body-parser
```

## 2. Create `server.js`
Create a file named `server.js` and paste the following code:

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Mock Data
const destinations = [
  {
    id: '1',
    title: 'Sunset Desert Safari',
    category: 'ADVENTURE',
    price: '$299',
    rating: '4.9',
    imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Zen Mountain Retreat',
    category: 'WELLNESS',
    price: '$450',
    rating: '4.8',
    imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Azure Yacht Expedition',
    category: 'LUXURY',
    price: '$1,200',
    rating: '5.0',
    imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ad96a?q=80&w=800&auto=format&fit=crop',
  }
];

// Auth Endpoints
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email}`);
  if (email && password) {
    res.status(200).json({ message: 'Login successful', token: 'mock-jwt-token' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  console.log(`Signup attempt: ${name} (${email})`);
  res.status(201).json({ message: 'User created successfully' });
});

app.post('/api/v1/auth/logout', (req, res) => {
  console.log('Logout attempt');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Destination Endpoints
app.get('/api/v1/destinations', (req, res) => {
  res.status(200).json(destinations);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

## 3. Run the server
```bash
node server.js
```

## Important Notes
- **Android Emulator**: Uses `http://10.0.2.2:3000` to access your computer's localhost.
- **iOS Simulator**: Uses `http://localhost:3000`.
- **Physical Device**: Use your computer's local IP address (e.g., `http://192.168.1.5:3000`) and ensure both devices are on the same Wi-Fi.
