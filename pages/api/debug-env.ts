import type { NextApiRequest, NextApiResponse } from 'next';

const mask = (v?: string) => (v ? v.slice(0, 6) + '…' + v.slice(-4) : 'MISSING');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'MISSING',
    STRIPE_SECRET_KEY: mask(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: mask(process.env.STRIPE_WEBHOOK_SECRET),
    STRIPE_PRICE_SMALL: process.env.STRIPE_PRICE_SMALL || 'MISSING',
    STRIPE_PRICE_MEDIUM: process.env.STRIPE_PRICE_MEDIUM || 'MISSING',
    STRIPE_PRICE_LARGE: process.env.STRIPE_PRICE_LARGE || 'MISSING',
    AIRTABLE_API_KEY: mask(process.env.AIRTABLE_API_KEY),
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || 'MISSING',
    AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME || 'MISSING',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || 'MISSING',
    CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '(unused/ok if empty)'
  });
}
