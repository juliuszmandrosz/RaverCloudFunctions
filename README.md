# Tonight Cloud Functions

> **Status:** this project is no longer developed or maintained. The code is published as-is for
> reference.

## Overview

Serverless backend for the [Tonight apps](https://github.com/juliuszmandrosz/tonight-apps), a nightlife
platform for discovering events and clubs, buying tickets and collecting rewards. It works together with
the [Tonight API](https://github.com/juliuszmandrosz/tonight-api) (NestJS).

## Tech Stack

- **Runtime**: Firebase Cloud Functions (Node.js 16, TypeScript)
- **Database**: Cloud Firestore with composite indexes and security rules
- **Auth**: Firebase Authentication with role-based custom claims (user / partner)
- **Payments**: Stripe (payment intents, webhooks, refunds)
- **Search**: Algolia and Typesense (index sync through Firestore triggers)
- **Background jobs**: Google Cloud Tasks
- **Email**: SMTP (EmailLabs) and MailerLite
- **Tests**: Jest with `@firebase/rules-unit-testing` on the Firestore emulator

## Structure

| Path | Contents |
|---|---|
| `functions/src/firestore-functions` | callable functions used by the apps |
| `functions/src/firebase-triggers` | Firestore triggers (search index sync, notifications) |
| `functions/src/stripe-functions` | payments, ticket returns, refunds, event cancellation |
| `functions/src/stripe-webhooks` | Stripe webhooks (payment succeeded / requires action) with signature verification |
| `functions/src/auth-functions` | role checks based on custom claims |
| `functions/src/cloud-tasks` | scheduled and deferred jobs |
| `firestore.rules` | security rules |
| `functions/test` | security rules tests |

## Getting Started

```bash
cd functions
npm install
npm run serve      # build and start the functions emulator
npm test           # run the rules tests on the Firestore emulator
```

Secrets are not stored in the code. They are read from the Firebase functions config
(`firebase functions:config:set`), with the shape defined in
`functions/src/interfaces/functions-config.ts`: `project`, `algolia`, `stripe`, `typesense`,
`email_labs`, `mailer_lite`.

## License

Released under the [MIT License](LICENSE).
