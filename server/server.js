import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ImageKit from '@imagekit/nodejs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

// ImageKit upload authentication endpoint
app.get('/api/imagekit-auth', (req, res) => {
  try {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      return res.status(500).json({
        error: 'IMAGEKIT_PRIVATE_KEY is not configured'
      });
    }

    const { token, expire, signature } =
      imagekit.helper.getAuthenticationParameters();

    res.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY
    });

  } catch (error) {
    console.error('ImageKit authentication error:', error);

    res.status(500).json({
      error: 'Failed to generate ImageKit authentication parameters'
    });
  }
});

app.listen(PORT, () => {
  console.log(`ImageKit auth server running on http://localhost:${PORT}`);
});