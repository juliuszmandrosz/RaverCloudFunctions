import Stripe from "stripe";
import {env} from "../index";
import {apiVersion} from "../constants/stripe-constants";

export const stripe = new Stripe(env.stripe.testkey, {
    apiVersion: apiVersion
});