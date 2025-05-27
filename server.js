const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
const port = 3000; // You can use any port you like
require('dotenv').config();

// Middleware to parse JSON and urlencoded form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// A route to render your main.ejs page
app.get('/', (req, res) => {
    // If you need to pass data to your EJS template, you can do it here:
    // const data = { title: "My EJS Page", message: "Hello from the server!" };
    // res.render('main', data); 
    res.render('main'); // Renders views/main.ejs
});

// POST endpoint to handle chat form submission and send email
app.post('/send-chat-form', async (req, res) => {
    const { firstName, lastName, email, question } = req.body;

    // Configure your SMTP transporter (replace with your real credentials)
    let transporter = nodemailer.createTransport({
        service: 'gmail', // or another SMTP service
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: email,
        to: process.env.DESTINATION_EMAIL, // <-- Replace with your destination email
        subject: 'New Chat Form Submission',
        text: `שם פרטי: ${firstName}\nשם משפחה: ${lastName}\nאימייל: ${email}\nשאלה: ${question}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to send email' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});