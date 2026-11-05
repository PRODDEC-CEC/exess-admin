import ImageKit from '@imagekit/nodejs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    return res.status(500).json({
      error: 'IMAGEKIT_PRIVATE_KEY is not configured in Vercel environment variables'
    });
  }

  try {
    const imagekit = new ImageKit({ privateKey });
    const authParams = imagekit.helper.getAuthenticationParameters();

    return res.status(200).json({
      ...authParams,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.VITE_IMAGEKIT_PUBLIC_KEY || ''
    });
  } catch (err) {
    console.error('ImageKit auth generation error:', err);
    return res.status(500).json({
      error: err.message || 'ImageKit auth generation failed'
    });
  }
}

