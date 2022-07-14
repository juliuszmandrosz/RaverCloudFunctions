import { createTransport } from 'nodemailer';
import { getFunctionsConfig } from '../utils/get-functions-config';

const config = getFunctionsConfig().email_labs;
export const nodemailer = createTransport({
    host: 'smtp.emaillabs.net.pl',
    port: 587,
    secure: false,
    auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
    },
});
