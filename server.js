// server.js
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from 'public' directory (for sitemap.xml, robots.txt, images, favicons)
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main page
app.get('/', (req, res) => {
    const now = new Date();   // Format to YYYY-MM-DDTHH:MM:SSZ (without milliseconds)
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    const isoDateModified = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;

    // You can pass dynamic data to your EJS template if needed
    // For example, if the canonical URL or title might change based on parameters
    const viewData = {
        // Example: Pass the canonical URL if it's dynamic or configured
        canonicalUrl: `https://www.xn--5dbaiub9efbhvf.xyz${req.path}`,
        pageTitle: "בקרה תקציבית בפרויקטי נדל\"ן: מדריך אינטראקטיבי",
        currentIsoDate: isoDateModified
    };
    res.render('main', viewData);
});

// Route for sitemap.xml
app.get('/sitemap.xml', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Route for robots.txt (though often placing it in public is enough if express.static is at root)
// This explicit route ensures it's served correctly.
app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// POST endpoint to handle chat form submission
app.post('/send-chat-form', async (req, res) => {
    const { firstName, lastName, email, question } = req.body;

    if (!firstName || !lastName || !email || !question) {
        return res.status(400).json({ success: false, error: 'נא למלא את כל השדות הנדרשים.' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'כתובת אימייל לא תקינה.' });
    }


    // Configure your SMTP transporter
    // Ensure GMAIL_USER and GMAIL_PASS are set in your .env file or Cloud Run environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('Gmail credentials not configured in environment variables.');
        return res.status(500).json({ success: false, error: 'שגיאת שרת: תצורת שליחת מייל חסרה.' });
    }
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS // Use an App Password for Gmail in production
        }
    });

    const mailOptions = {
        from: `"${firstName} ${lastName}" <${process.env.GMAIL_USER}>`, // Sender appears as your GMAIL_USER
        replyTo: email, // When you reply, it goes to the form submitter's email
        to: process.env.GMAIL_DEST_EMAIL || process.env.GMAIL_USER, // Destination email
        subject: `פנייה חדשה מטופס צור קשר באתר: ${firstName} ${lastName}`,
        text: `התקבלה פנייה חדשה:\n\nשם פרטי: ${firstName}\nשם משפחה: ${lastName}\nאימייל: ${email}\n\nשאלה/הודעה:\n${question}`,
        html: `<p>התקבלה פנייה חדשה:</p>
               <p><b>שם פרטי:</b> ${firstName}</p>
               <p><b>שם משפחה:</b> ${lastName}</p>
               <p><b>אימייל:</b> <a href="mailto:${email}">${email}</a></p>
               <hr>
               <p><b>שאלה/הודעה:</b></p>
               <p>${question.replace(/\n/g, '<br>')}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Chat form email sent successfully.');
        res.json({ success: true, message: 'הפנייה נשלחה בהצלחה!' });
    } catch (err) {
        console.error('Failed to send email:', err);
        res.status(500).json({ success: false, error: 'שליחת הפנייה נכשלה. אנא נסה שוב מאוחר יותר.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}. Access at http://localhost:${port}`);
});