import * as QRCode from 'qrcode';
import { nodemailer } from '../../modules/nodemailer-module';
import { User } from '../../models/user';

interface SendQrCodeToEmailParams {
    ticketId: string;
    user: User;
    eventName: string;
}

export async function sendQrCodeToEmail({ user, ticketId, eventName }: SendQrCodeToEmailParams) {
    const qrCodeData = { userId: user.id, ticketId };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData), { type: 'image/png' });
    await nodemailer.sendMail({
        to: user.email,
        from: 'noreply@tonightapp.pl',
        subject: getEmailSubject(user.locale, eventName),
        attachments: [
            {
                filename: `qr_${eventName.substring(0, 15)}.png`,
                content: qrCode.split('base64,')[1],
                encoding: 'base64',
            },
        ],
    });
}

function getEmailSubject(locale: string, eventName: string) {
    if (locale === 'pl') {
        return `Twój bilet na ${eventName}`;
    }

    return `Your ticket for ${eventName}`;
}
