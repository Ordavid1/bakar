const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

// PORT environment variable is provided by Cloud Run.
// Use it if available, otherwise default to 3000 for local development.
const port = process.env.PORT || 3000;

// Middleware to parse JSON and urlencoded form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// A route to render your main.ejs page
app.get('/', (req, res) => {
    res.render('main'); // Renders views/main.ejs
});

// POST endpoint to handle chat form submission and send email
app.post('/send-chat-form', async (req, res) => {
    const { firstName, lastName, email, question } = req.body;

    // Configure your SMTP transporter
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: email, // This is the email from the form filler
        to: process.env.GMAIL_DEST_EMAIL || process.env.GMAIL_USER, // Use a specific destination or default to GMAIL_USER
        subject: 'New Chat Form Submission from Bakar Site',
        text: `שם פרטי: ${firstName}\nשם משפחה: ${lastName}\nאימייל: ${email}\nשאלה: ${question}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send email:', err); // Log the error
        res.status(500).json({ success: false, error: 'Failed to send email' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});