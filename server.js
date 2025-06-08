// server.js - Fixed for Local Development
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Only use compression and helmet in production
if (isProduction) {
    const compression = require('compression');
    const helmet = require('helmet');
    
    // Compression
    app.use(compression({
        level: 6,
        threshold: 100 * 1024,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    }));
    
    // Security Headers with Helmet - Only in production
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
                connectSrc: ["'self'", "https://www.google-analytics.com", "https://www.googletagmanager.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                frameSrc: ["'self'", "https://www.googletagmanager.com"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
}

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cache Control Headers for Static Assets - with production check
const setCache = (res, path) => {
    if (isProduction) {
        if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2|ttf|eot)$/)) {
            const period = path.match(/\.(jpg|jpeg|gif|png|ico|svg|webp)$/) ? '1y' : '1M';
            res.setHeader('Cache-Control', `public, max-age=${period === '1y' ? 31536000 : 2592000}, immutable`);
        } else if (path.match(/\.(html|xml|txt|json)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        }
    }
};

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    setHeaders: isProduction ? setCache : undefined,
    maxAge: isProduction ? '1d' : 0
}));

// Custom headers middleware - simplified for development
app.use((req, res, next) => {
    if (isProduction) {
        // Security headers
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // SEO headers
        res.setHeader('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }
    
    next();
});

// Redirect www to non-www - ONLY IN PRODUCTION
if (isProduction) {
    app.use((req, res, next) => {
        const host = req.get('Host');
        if (host && host.startsWith('www.')) {
            return res.redirect(301, 'https://' + host.slice(4) + req.originalUrl);
        }
        next();
    });
    
    // Force HTTPS in production
    app.use((req, res, next) => {
        const host = req.header('host');
        // Skip HTTPS redirect for localhost
        if (host && host.includes('localhost')) {
            return next();
        }
        
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(301, `https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Main route with enhanced performance
app.get('/', (req, res) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');

    const isoDateModified = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;

    const viewData = {
        canonicalUrl: `https://www.xn--5dbaiub9efbhvf.xyz${req.path}`,
        pageTitle: "בקרה תקציבית בפרויקטי נדל\"ן: מדריך אינטראקטיבי",
        currentIsoDate: isoDateModified
    };
    
    if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    }
    res.render('main', viewData);
});

// Sitemap route with proper content type
app.get('/sitemap.xml', (req, res) => {
    res.setHeader('Content-Type', 'application/xml');
    if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Robots.txt route
app.get('/robots.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Manifest route
app.get('/site.webmanifest', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=604800');
    }
    res.sendFile(path.join(__dirname, 'public', 'site.webmanifest'));
});

// Security.txt route
app.get('/.well-known/security.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    res.send(`Contact: mailto:security@xn--5dbaiub9efbhvf.xyz
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Preferred-Languages: he, en
Canonical: https://www.xn--5dbaiub9efbhvf.xyz/.well-known/security.txt`);
});

// Newsletter signup endpoint
app.post('/newsletter-signup', async (req, res) => {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'כתובת אימייל לא תקינה' });
    }
    
    // TODO: Add newsletter signup logic here
    res.json({ success: true, message: 'נרשמת בהצלחה לניוזלטר!' });
});

// Chat form submission
const recentSubmissions = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SUBMISSIONS = 3;

app.post('/send-chat-form', async (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Basic rate limiting - only in production
    if (isProduction) {
        if (recentSubmissions.has(clientIp)) {
            const submissions = recentSubmissions.get(clientIp);
            const recentCount = submissions.filter(time => now - time < RATE_LIMIT_WINDOW).length;
            
            if (recentCount >= MAX_SUBMISSIONS) {
                return res.status(429).json({ 
                    success: false, 
                    error: 'יותר מדי בקשות. אנא המתן דקה ונסה שוב.' 
                });
            }
            submissions.push(now);
        } else {
            recentSubmissions.set(clientIp, [now]);
        }
    }
    
    const { firstName, lastName, email, question } = req.body;

    if (!firstName || !lastName || !email || !question) {
        return res.status(400).json({ success: false, error: 'נא למלא את כל השדות הנדרשים.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'כתובת אימייל לא תקינה.' });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
        console.error('Gmail credentials not configured in environment variables.');
        return res.status(500).json({ success: false, error: 'שגיאת שרת: תצורת שליחת מייל חסרה.' });
    }
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"${firstName} ${lastName}" <${process.env.GMAIL_USER}>`,
        replyTo: email,
        to: process.env.GMAIL_DEST_EMAIL || process.env.GMAIL_USER,
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

// Health check endpoint for Cloud Run and monitoring
app.get('/health', (req, res) => {
    // Basic health check
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development'
    };
    
    // You can add more checks here if needed
    try {
        res.status(200).json(healthcheck);
    } catch (error) {
        healthcheck.message = error.message;
        res.status(503).json(healthcheck);
    }
});

// 404 Error Handler
app.use((req, res, next) => {
    res.status(404);
    if (isProduction) {
        res.setHeader('X-Robots-Tag', 'noindex');
    }
    res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - הדף לא נמצא | בקרה תקציבית</title>
    <meta name="robots" content="noindex, follow">
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-800">
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-6xl font-bold text-blue-600 mb-4">404</h1>
            <h2 class="text-2xl font-semibold mb-4">הדף שחיפשת לא נמצא</h2>
            <p class="text-slate-600 mb-8">ייתכן שהדף הועבר או נמחק.</p>
            <a href="/" class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">חזרה לדף הבית</a>
        </div>
    </div>
</body>
</html>
    `);
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500);
    if (isProduction) {
        res.setHeader('X-Robots-Tag', 'noindex');
    }
    res.send('שגיאת שרת פנימית');
});

// Start server
app.listen(port, () => {
    console.log(`
    🚀 Server running on port ${port}
    🌐 Access at http://localhost:${port}
    📱 Mobile-optimized and PWA-ready
    🔍 SEO-optimized with structured data
    ${isProduction ? '🔒 Security headers enabled' : '🛠️  Development mode - security features disabled'}
    ${isProduction ? '⚡ Performance optimizations active' : '🛠️  Development mode - no caching'}
    `);
});