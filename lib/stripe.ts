import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[stripe] Missing STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // compatible with current stripe typings
});

export const PRICE_IDS = {
  small: process.env.STRIPE_PRICE_SMALL!,
  medium: process.env.STRIPE_PRICE_MEDIUM!,
  large: process.env.STRIPE_PRICE_LARGE!,
} as const;
