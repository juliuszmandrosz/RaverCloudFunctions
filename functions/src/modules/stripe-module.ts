import Stripe from 'stripe';
import { apiVersion } from '../constants/stripe-constants';
import { getFunctionsConfig } from '../utils/get-functions-config';

const config = getFunctionsConfig().stripe;
export const stripe = new Stripe(config.api_key, {
    apiVersion: apiVersion,
});
