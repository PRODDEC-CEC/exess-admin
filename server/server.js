import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ImageKit from '@imagekit/nodejs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS requests in local development
app.use(cors());

// ImageKit upload authentication endpoint
app.get('/api/imagekit-auth', (req, res) => {
  try {
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('ImageKit Auth Error: IMAGEKIT_PRIVATE_KEY is not configured in .env');
      return res.status(500).json({
        error: 'IMAGEKIT_PRIVATE_KEY is not configured in .env'
      });
    }

    const imagekit = new ImageKit({ privateKey });
    const { token, expire, signature } =
      imagekit.helper.getAuthenticationParameters();

    res.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY || ''
    });

  } catch (error) {
    console.error('ImageKit authentication error:', error);

    res.status(500).json({
      error: error.message || 'Failed to generate ImageKit authentication parameters'
    });
  }
});

app.listen(PORT, () => {
  console.log(`ImageKit auth server running on http://localhost:${PORT}`);
});
