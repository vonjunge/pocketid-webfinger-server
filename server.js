const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use(limiter);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '1kb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Input validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Parse user identities from environment variables
function parseUserIdentities() {
  const users = {};
  let i = 1;
  
  while (process.env[`USER_${i}_EMAIL`]) {
    const email = process.env[`USER_${i}_EMAIL`];
    
    // Validate email
    if (!isValidEmail(email)) {
      console.warn(`Invalid email format for USER_${i}_EMAIL: ${email}`);
      i++;
      continue;
    }
    
    const resource = `acct:${email}`;
    const subject = resource; // Subject is always the same as resource for standard WebFinger
    const aliases = process.env[`USER_${i}_ALIASES`] ? process.env[`USER_${i}_ALIASES`].split(',').filter(isValidUrl) : [];
    const links = [];
    
    // Parse links for this user
    let linkIndex = 1;
    while (process.env[`USER_${i}_LINK_${linkIndex}_REL`]) {
      const href = process.env[`USER_${i}_LINK_${linkIndex}_HREF`];
      
      // Validate URL
      if (!isValidUrl(href)) {
        console.warn(`Invalid URL for USER_${i}_LINK_${linkIndex}_HREF: ${href}`);
        linkIndex++;
        continue;
      }
      
      const link = {
        rel: process.env[`USER_${i}_LINK_${linkIndex}_REL`],
        href: href
      };
      
      if (process.env[`USER_${i}_LINK_${linkIndex}_TYPE`]) {
        link.type = process.env[`USER_${i}_LINK_${linkIndex}_TYPE`];
      }
      
      links.push(link);
      linkIndex++;
    }
    
    users[resource] = {
      subject,
      aliases,
      links
    };
    
    i++;
  }
  
  return users;
}

const users = parseUserIdentities();

// WebFinger endpoint
app.get('/.well-known/webfinger', (req, res) => {
  const resource = req.query.resource;
  
  if (!resource) {
    return res.status(400).json({
      error: 'Missing resource parameter'
    });
  }
  
  const user = users[resource];
  
  if (!user) {
    return res.status(404).json({
      error: 'Resource not found'
    });
  }
  
  const response = {
    subject: user.subject,
    aliases: user.aliases,
    links: user.links
  };
  
  res.setHeader('Content-Type', 'application/jrd+json');
  res.json(response);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' }); // Don't expose user count
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`WebFinger server running on port ${PORT}`);
  console.log(`Configured ${Object.keys(users).length} user(s)`); // Don't expose actual user list
});
