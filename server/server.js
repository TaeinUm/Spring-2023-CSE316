const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = process.env.PORT || 3001;

// Start the server
const server = http.createServer(app);
const io = socketIO(server);

const connection = mysql.createConnection({
  host: 'localhost', // MySQL host
  user: 'root', // MySQL username
  password: 'rootroot', // MySQL password
  database: 'notesman', // MySQL database name
});

connection.connect((error) => {
  if (error) {
    console.error('Error connecting to MySQL:', error);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.use(cors());
app.use(express.json()); // Add this line to parse JSON data in requests

app.get('/api/notes', (req, res) => {
  const sql = 'SELECT * FROM notes';
  connection.query(sql, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send({ data: data });
    }
  });
});

app.get('/api/user/', (req, res) => {
    const sql = 'SELECT * FROM user';
    connection.query(sql, (err, data) => {
        if (err) {
        res.status(500).send(err);
        } else {
        res.send({ data: data });
        }
    });
});

app.post('/api/notes/add', async (req, res) => {
    const { notes, dates } = req.query;
    const sql = 'INSERT INTO notes (notes, dates) VALUES (?, ?)';
    const values = [notes, dates];
  
    try {
      await connection.query(sql, values);
      return res.sendStatus(200);
    } catch (error) {
      console.error('Error adding note:', error);
      return res.status(500).send(error);
    }
  });

app.get('/api/profile', (req, res) => {
  const query = 'SELECT name, email, color FROM users WHERE id = 1'; // Adjust the query according to your table structure and user identification

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing MySQL query:', error);
      res.status(500).json({ error: 'Failed to fetch profile data' });
    } else {
      if (results.length > 0) {
        const profileData = {
          name: results[0].name,
          email: results[0].email,
          colorScheme: results[0].color,
        };
        res.json(profileData);
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    }
  });
});

app.delete('/api/note/delete', async (req, res) => {
    const { seq } = req.query;
    const sql = 'DELETE FROM Note WHERE seq = ?';
    connection.query(sql, [seq], (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(result);
      }
    });
});

app.post('/api/note/update', async (req, res) => {
    const { seq, notes, dates } = req.query;
    const sql = 'UPDATE Note SET notes = ?, dates = ? WHERE seq = ?';
    const result = await connection.query(sql, [notes, dates, seq], (err, result) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        return res.send(result);
      }
    });
});

app.post('/signup', (req, res) => {
  const { name, email, password, color, image } = req.body;

  // Check if the email already exists in the database
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (error, results) => {
      if (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'An error occurred during sign up' });
      } else {
        if (results.length > 0) {
          // Email already exists, deny sign up
          res.status(409).json({ error: 'Email already exists. Please choose a different email.' });
        } else {
          // Email doesn't exist, proceed with sign up
          const sql = 'INSERT INTO users (name, email, password, color, image) VALUES (?, ?, ?, ?, ?)';
          connection.query(sql, [name, email, password, color, image], (error, results) => {
            if (error) {
              console.error('Error signing up:', error);
              res.status(500).json({ error: 'An error occurred during sign up' });
            } else {
              console.log('User signed up successfully');
              res.status(200).json({ message: 'User signed up successfully' });
            }
          });
        }
      }
    }
  );
});


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // No need to hash the password on the server-side

  // Check if the email and password match a user in the database
  connection.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (error, results) => {
      if (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).json({ error: 'An error occurred during login.' });
      } else {
        if (results.length > 0) {
          // Login successful
          res.json({ message: 'Login successful.' });
        } else {
          // Login failed
          res.status(401).json({ error: 'Invalid email or password.' });
        }
      }
    }
  );
});

cloudinary.config({
  cloud_name: "defo3yb70",
  api_key: "685521329381427",
  api_secret: "KEjXTr_JE0lF6KEWzwv4-Y7qinQ"
});

app.post('/api/uploadImg', async (req, res) => {
  try {
    const imageFile = req.files.image;
    const result = await cloudinary.uploader.upload(imageFile.tempFilePath);

    // Get the uploaded image URL from the Cloudinary response
    const imageUrl = result.secure_url;

    // You can perform any additional processing or saving of the image URL here

    res.json({ imageUrl });
  } catch (error) {
    console.error('Image upload failed', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
