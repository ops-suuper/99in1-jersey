import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PRICE_IDS = {
  small: process.env.STRIPE_PRICE_SMALL!,
  medium: process.env.STRIPE_PRICE_MEDIUM!,
  large: process.env.STRIPE_PRICE_LARGE!
};
