import * as fs from 'fs';
import { v1 } from 'uuid';
import * as firebase from '@firebase/rules-unit-testing';
import { serverTimestamp as st } from 'firebase/firestore';
import { Review } from '../src/models/review';

const serverTimestamp = () => st();

let testEnv: firebase.RulesTestEnvironment;

beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
        projectId: 'raver-1fec4',
        firestore: {
            rules: fs.readFileSync('../firestore.rules', 'utf8'),
        },
    });
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

afterAll(async () => {
    await testEnv.cleanup();
});

async function setClubForPartner(partnerId: string, clubId: string) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`partners/${partnerId}`).set({
            clubId: clubId,
        });
    });
}

async function setEventTickets(clubId: string, eventId: string) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
            .firestore()
            .doc(`clubs/${clubId}/eventTickets/${eventId}`)
            .set({
                ticketSales: {
                    clubIncome: 50,
                },
            });
    });
}

describe('available filters', () => {
    it('should allow read with authenticated context', async () => {
        const uid = v1();
        const context = testEnv.authenticatedContext(uid);
        await firebase.assertSucceeds(context.firestore().doc(`availableFilters/filters`).get());
    });

    it('should deny read with unauthenticated context', async () => {
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`availableFilters/filters`).get());
    });

    it('should deny write', async () => {
        const uid = v1();
        const context = testEnv.authenticatedContext(uid);
        await firebase.assertFails(context.firestore().doc(`availableFilters/filters`).set({}));
    });
});

describe('clubs', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const clubId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(context.firestore().doc(`clubs/${clubId}`).get());
    });

    it('should deny read with unauthenticated context', async () => {
        const clubId = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`clubs/${clubId}`).get());
    });

    it('should allow write on own club with partner claim', async () => {
        const clubId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(context.firestore().doc(`clubs/${clubId}`).set({}));
    });

    it('should deny write on own club without partner claim', async () => {
        const clubId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId);
        await firebase.assertFails(context.firestore().doc(`clubs/${clubId}`).set({}));
    });

    it('should deny write on other club with partner claim', async () => {
        const clubId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`clubs/${clubId}`).set({}));
    });
});

describe('applied discounts', () => {
    it('should allow read on own club with partner claim', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).get()
        );
    });

    it('should allow create on own club with partner claim', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).set({})
        );
    });

    it('should deny read on other club with partner claim', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).get()
        );
    });

    it('should deny create on other club with partner claim', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).set({})
        );
    });

    it('should deny delete', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).delete()
        );
    });

    it('should deny update', async () => {
        const clubId = v1();
        const discountId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/appliedDiscounts/${discountId}`).delete()
        );
    });
});

describe('event costs', () => {
    it('should allow read on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).get()
        );
    });

    it('should deny read on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).get()
        );
    });

    it('should deny write', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).set({})
        );
    });
});

describe('event review', () => {
    it('should allow read on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).get()
        );
    });

    it('should deny read on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).get()
        );
    });

    it('should deny write', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).set({})
        );
    });
});

describe('event tickets', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const eventId = v1();
        const clubId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).get()
        );
    });

    it('should deny read with unauthenticated context', async () => {
        const clubId = v1();
        const eventId = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).get()
        );
    });

    it('should allow update on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);
        await setEventTickets(clubId, eventId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).update({})
        );
    });

    it('should deny update on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setEventTickets(clubId, eventId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).update({})
        );
    });

    it('should deny update if ticket sales has changed', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);
        await setEventTickets(clubId, eventId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/eventTickets/${eventId}`)
                .update({
                    ticketSales: {
                        clubIncome: 100,
                    },
                })
        );
    });

    it('should deny create', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).set({})
        );
    });

    it('should deny delete', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).delete()
        );
    });
});

describe('reviews', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).get()
        );
    });

    it('should deny read with unauthenticated context', async () => {
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).get()
        );
    });

    it('should allow create with user claim, user rate in range 1 and 5 and empty user opinion', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertSucceeds(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({ userRate: 5, userOpinion: '' } as Review)
        );
    });

    it('should deny create with user claim, user rate in range 1 and 5 and user opinion with more than 1000 characters', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({
                    userRate: 5,
                    userOpinion: '#'.repeat(1001),
                } as Review)
        );
    });

    it('should deny create with user claim and user rate out of range 1 and 5', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).set({ userRate: 0 })
        );
    });

    it('should deny create without user claim', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).set({})
        );
    });

    it('should deny update', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/reviews/${reviewId}`).delete()
        );
    });
});

describe('users', () => {
    it('should allow write on own document for user', async () => {
        const uid = v1();
        const context = testEnv.authenticatedContext(uid);
        await firebase.assertSucceeds(context.firestore().doc(`users/${uid}`).set({}));
    });

    it('should deny write on other document for user', async () => {
        const context = testEnv.authenticatedContext(v1());
        const uid = v1();
        await firebase.assertFails(context.firestore().doc(`users/${uid}`).set({}));
    });

    it('should deny write with unauthenticated context', async () => {
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`users/${v1()}`).set({}));
    });

    it('should allow read on own document for user', async () => {
        const uid = v1();
        const context = testEnv.authenticatedContext(uid);
        await firebase.assertSucceeds(context.firestore().doc(`users/${uid}`).get());
    });

    it('should deny read on other document for user', async () => {
        const context = testEnv.authenticatedContext(v1());
        const uid = v1();
        await firebase.assertFails(context.firestore().doc(`users/${uid}`).get());
    });

    it('should deny read with unauthenticated context', async () => {
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`users/${v1()}`).get());
    });
});
