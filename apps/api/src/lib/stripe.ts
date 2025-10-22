import Stripe from 'stripe';
import { config } from '../config';

export const stripe = new Stripe(config.stripe.secretKey || 'sk_test_placeholder', {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
});

export default stripe;