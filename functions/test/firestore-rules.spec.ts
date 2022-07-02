import * as fs from 'fs';
import { v1 } from 'uuid';
import * as firebase from '@firebase/rules-unit-testing';
import { Review } from '../src/models/review';
import { Ticket } from '../src/models/ticket';
import { EventTickets } from '../src/models/event-tickets';
import { serverTimestamp } from 'firebase/firestore';
import { Reward } from '../src/models/reward';

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

interface SetEventTicketsParams {
    clubId: string;
    eventId: string;
    eventTickets: EventTickets;
}

async function setEventTickets({ clubId, eventId, eventTickets }: SetEventTicketsParams) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).set(eventTickets);
    });
}

interface SetTicketForUserParams {
    userId: string;
    ticketId: string;
    ticket: Ticket;
}

async function setTicketForUser({ userId, ticketId, ticket }: SetTicketForUserParams) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().doc(`users/${userId}/tickets/${ticketId}`).set(ticket);
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

    it('should allow create on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).set({})
        );
    });

    it('should deny create on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).set({})
        );
    });

    it('should deny update', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventCosts/${eventId}`).update({})
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

    it('should allow create on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).set({})
        );
    });

    it('should deny create on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).set({})
        );
    });

    it('should deny update', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventReview/${eventId}`).delete()
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
        const eventTickets = { ticketSales: { clubIncome: 50 } } as EventTickets;

        await setClubForPartner(partnerId, clubId);
        await setEventTickets({ clubId, eventId, eventTickets });

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).update({})
        );
    });

    it('should deny update on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();
        const eventTickets = { ticketSales: { clubIncome: 50 } } as EventTickets;

        await setEventTickets({ clubId, eventId, eventTickets });

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).update({})
        );
    });

    it('should allow create on own club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).set({})
        );
    });

    it('should deny create on other club with partner claim', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();
        const eventTickets = { ticketSales: { clubIncome: 50 } } as EventTickets;

        await setEventTickets({ clubId, eventId, eventTickets });

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/eventTickets/${eventId}`).set({})
        );
    });

    it('should deny update if ticket sales has changed', async () => {
        const clubId = v1();
        const eventId = v1();
        const partnerId = v1();
        const eventTickets = { ticketSales: { clubIncome: 50 } } as EventTickets;

        await setClubForPartner(partnerId, clubId);
        await setEventTickets({ clubId, eventId, eventTickets });

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
        const ticketId = v1();

        const ticket = {
            isExpired: true,
            eventEndDateTime: serverTimestamp(),
        } as Ticket;

        await setTicketForUser({ userId, ticketId, ticket });

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertSucceeds(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({ userRate: 5, userOpinion: '', ticketId } as Review)
        );
    });

    it('should allow create with user claim, expired ticket, user rate in range 1 and 5 and user opinion with less or equal 1000 characters', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();
        const ticketId = v1();

        const ticket = {
            isExpired: true,
            eventEndDateTime: serverTimestamp(),
        } as Ticket;

        await setTicketForUser({ userId, ticketId, ticket });

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertSucceeds(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({ userRate: 5, userOpinion: '#'.repeat(1000), ticketId: ticketId } as Review)
        );
    });

    it('should deny create with user claim, without expired ticket, user rate in range 1 and 5 and user opinion with less or equal 1000 characters', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();
        const ticketId = v1();
        const ticket = { isExpired: false } as Ticket;

        await setTicketForUser({ userId, ticketId, ticket });

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({ userRate: 5, userOpinion: '#'.repeat(1000), ticketId: ticketId } as Review)
        );
    });

    it('should deny create with user claim, expired ticket, user rate in range 1 and 5 and user opinion with more than 1000 characters', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();
        const ticketId = v1();
        const ticket = { isExpired: true } as Ticket;

        await setTicketForUser({ userId, ticketId, ticket });

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({
                    userRate: 5,
                    userOpinion: '#'.repeat(1001),
                    ticketId,
                } as Review)
        );
    });

    it('should deny create with user claim and user rate out of range 1 and 5', async () => {
        const userId = v1();
        const clubId = v1();
        const reviewId = v1();
        const ticketId = v1();
        const ticket = { isExpired: true } as Ticket;

        await setTicketForUser({ userId, ticketId, ticket });

        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/reviews/${reviewId}`)
                .set({ userRate: 0, ticketId } as Review)
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

describe('rewards', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const clubId = v1();
        const rewardId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).get()
        );
    });

    it('should allow read with unauthenticated context', async () => {
        const clubId = v1();
        const rewardId = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).get()
        );
    });

    it('should allow create on own club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context
                .firestore()
                .doc(`clubs/${clubId}/rewards/${rewardId}`)
                .set({ requiredEntries: 1, description: '#' } as Reward)
        );
    });

    it('should deny create on own club with partner claim and negative number of entries', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/rewards/${rewardId}`)
                .set({ requiredEntries: -1, description: '#' } as Reward)
        );
    });

    it('should deny create on own club with partner claim and empty description', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/rewards/${rewardId}`)
                .set({ requiredEntries: 1, description: '' } as Reward)
        );
    });

    it('should deny create on own club without partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId);
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/rewards/${rewardId}`)
                .set({ requiredEntries: 1, description: '#' } as Reward)
        );
    });

    it('should deny create on other club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context
                .firestore()
                .doc(`clubs/${clubId}/rewards/${rewardId}`)
                .set({ requiredEntries: 1, description: '#' } as Reward)
        );
    });

    it('should allow delete on own club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).delete()
        );
    });

    it('should deny delete on own club without partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId);
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).delete()
        );
    });

    it('should deny delete on other club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).delete()
        );
    });

    it('should deny update', async () => {
        const partnerId = v1();
        const clubId = v1();
        const rewardId = v1();

        await setClubForPartner(partnerId, clubId);

        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/rewards/${rewardId}`).update({})
        );
    });
});

describe('club selectors', () => {
    it('should allow read on own club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).get()
        );
    });

    it('should deny read on other club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).get()
        );
    });

    it('should allow read on own document as selector with selector claim', async () => {
        const clubId = v1();
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).get()
        );
    });

    it('should deny read on other document as selector with selector claim', async () => {
        const clubId = v1();
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/selectors/${v1()}`).get()
        );
    });

    it('should allow delete on own club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).delete()
        );
    });

    it('should deny delete on other club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).delete()
        );
    });

    it('should deny create', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).set({})
        );
    });

    it('should deny update', async () => {
        const partnerId = v1();
        const clubId = v1();
        const selectorId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`clubs/${clubId}/selectors/${selectorId}`).update({})
        );
    });
});

describe('clubs sales', () => {
    it('should allow read on own club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(context.firestore().doc(`clubsSales/${clubId}`).get());
    });

    it('should deny read on other club with partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`clubsSales/${clubId}`).get());
    });

    it('should deny write', async () => {
        const partnerId = v1();
        const clubId = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`clubsSales/${clubId}`).set({}));
    });
});

describe('currency params', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(context.firestore().doc(`currencyParams/pln`).get());
    });

    it('should deny read with unauthenticated context', async () => {
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`currencyParams/pln`).get());
    });

    it('should deny create', async () => {
        const userId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(context.firestore().doc(`currencyParams/pln`).set({}));
    });

    it('should deny update', async () => {
        const userId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(context.firestore().doc(`currencyParams/pln`).update({}));
    });

    it('should deny delete', async () => {
        const userId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(context.firestore().doc(`currencyParams/pln`).delete());
    });
});

describe('partners', () => {
    it('should allow read on own document with partner claim', async () => {
        const partnerId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(context.firestore().doc(`partners/${partnerId}`).get());
    });

    it('should deny read on other document with partner claim', async () => {
        const partnerId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`partners/${v1()}`).get());
    });

    it('should deny create', async () => {
        const partnerId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`partners/${v1()}`).set({}));
    });

    it('should deny update', async () => {
        const partnerId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`partners/${v1()}`).update({}));
    });

    it('should deny delete', async () => {
        const partnerId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(context.firestore().doc(`partners/${v1()}`).delete());
    });
});

describe('partners access codes', () => {
    it('should allow read with unauthenticated context', async () => {
        const accessCode = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertSucceeds(
            context.firestore().doc(`partnersAccessCodes/${accessCode}`).get()
        );
    });

    it('should deny create', async () => {
        const userId = v1();
        const accessCode = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`partnersAccessCodes/${accessCode}`).set({})
        );
    });

    it('should deny update', async () => {
        const userId = v1();
        const accessCode = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`partnersAccessCodes/${accessCode}`).update({})
        );
    });

    it('should deny delete', async () => {
        const userId = v1();
        const accessCode = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`partnersAccessCodes/${accessCode}`).delete()
        );
    });
});

describe('partners discounts', () => {
    it('should allow read with partner claim', async () => {
        const partnerId = v1();
        const discountId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`partnersDiscounts/${discountId}`).get()
        );
    });

    it('should deny read without partner claim', async () => {
        const partnerId = v1();
        const discountId = v1();
        const context = testEnv.authenticatedContext(partnerId);
        await firebase.assertFails(
            context.firestore().doc(`partnersDiscounts/${discountId}`).get()
        );
    });

    it('should deny create', async () => {
        const partnerId = v1();
        const discountId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`partnersDiscounts/${discountId}`).set({})
        );
    });

    it('should deny update', async () => {
        const partnerId = v1();
        const discountId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`partnersDiscounts/${discountId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const partnerId = v1();
        const discountId = v1();
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`partnersDiscounts/${discountId}`).delete()
        );
    });
});

describe('review reports', () => {
    it('should allow read with authenticated context', async () => {
        const userId = v1();
        const reportId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(context.firestore().doc(`reviewReports/${reportId}`).get());
    });

    it('should deny read with unauthenticated context', async () => {
        const reportId = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`reviewReports/${reportId}`).get());
    });

    it('should allow create with own reporter id', async () => {
        const userId = v1();
        const reportId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertSucceeds(
            context.firestore().doc(`reviewReports/${reportId}`).set({
                reporterId: userId,
            })
        );
    });

    it('should deny create without own reporter id', async () => {
        const userId = v1();
        const reportId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`reviewReports/${reportId}`).set({
                reporterId: v1(),
            })
        );
    });

    it('should deny create with unauthenticated context', async () => {
        const reportId = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertFails(context.firestore().doc(`reviewReports/${reportId}`).set({}));
    });
});

describe('selectors', () => {
    it('should allow read on own document with selector claim', async () => {
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertSucceeds(context.firestore().doc(`selectors/${selectorId}`).get());
    });

    it('should deny read on other document with selector claim', async () => {
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertFails(context.firestore().doc(`selectors/${v1()}`).get());
    });

    it('should deny create', async () => {
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertFails(context.firestore().doc(`selectors/${selectorId}`).set({}));
    });

    it('should deny update', async () => {
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertFails(context.firestore().doc(`selectors/${selectorId}`).update({}));
    });

    it('should deny delete', async () => {
        const selectorId = v1();
        const context = testEnv.authenticatedContext(selectorId, { isSelector: true });
        await firebase.assertFails(context.firestore().doc(`selectors/${selectorId}`).delete());
    });
});

describe('selectors access codes', () => {
    it('should allow read with unauthenticated context', async () => {
        const accessCode = v1();
        const context = testEnv.unauthenticatedContext();
        await firebase.assertSucceeds(
            context.firestore().doc(`selectorsAccessCodes/${accessCode}`).get()
        );
    });

    it('should allow create with access to club and partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const accessCode = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertSucceeds(
            context.firestore().doc(`selectorsAccessCodes/${accessCode}`).set({ clubId: clubId })
        );
    });

    it('should deny create without access to club and partner claim', async () => {
        const partnerId = v1();
        const clubId = v1();
        const accessCode = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`selectorsAccessCodes/${accessCode}`).set({ clubId: v1() })
        );
    });

    it('should deny update', async () => {
        const partnerId = v1();
        const clubId = v1();
        const accessCode = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`selectorsAccessCodes/${accessCode}`).update({})
        );
    });

    it('should deny delete', async () => {
        const partnerId = v1();
        const clubId = v1();
        const accessCode = v1();
        await setClubForPartner(partnerId, clubId);
        const context = testEnv.authenticatedContext(partnerId, { isPartner: true });
        await firebase.assertFails(
            context.firestore().doc(`selectorsAccessCodes/${accessCode}`).delete()
        );
    });
});

describe('stripe customers', () => {
    it('should allow read on own document', async () => {
        const customerId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await firebase.assertSucceeds(
            context.firestore().doc(`stripeCustomers/${customerId}`).get()
        );
    });

    it('should deny read on other document', async () => {
        const customerId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await firebase.assertFails(context.firestore().doc(`stripeCustomers/${v1()}`).get());
    });

    it('should allow update on own document', async () => {
        const customerId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().doc(`stripeCustomers/${customerId}`).set({});
        });
        await firebase.assertSucceeds(
            context.firestore().doc(`stripeCustomers/${customerId}`).update({})
        );
    });

    it('should deny update on other document', async () => {
        const customerId = v1();
        const otherId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await context.firestore().doc(`stripeCustomers/${otherId}`).set({});
        });
        await firebase.assertFails(context.firestore().doc(`stripeCustomers/${otherId}`).get());
    });

    it('should deny create', async () => {
        const customerId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await firebase.assertFails(
            context.firestore().doc(`stripeCustomers/${customerId}`).set({})
        );
    });

    it('should deny delete', async () => {
        const customerId = v1();
        const context = testEnv.authenticatedContext(customerId);
        await firebase.assertFails(
            context.firestore().doc(`stripeCustomers/${customerId}`).delete()
        );
    });
});

describe('ticket payment sessions', () => {
    it('should deny read', async () => {
        const userId = v1();
        const sessionId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`ticketPaymentSessions/${sessionId}`).get()
        );
    });

    it('should deny create', async () => {
        const userId = v1();
        const sessionId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`ticketPaymentSessions/${sessionId}`).set({})
        );
    });

    it('should deny update', async () => {
        const userId = v1();
        const sessionId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`ticketPaymentSessions/${sessionId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const userId = v1();
        const sessionId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`ticketPaymentSessions/${sessionId}`).delete()
        );
    });
});

describe('update clubs sales task', () => {
    it('should deny read', async () => {
        const userId = v1();
        const eventId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`updateClubSalesTasks/${eventId}`).get()
        );
    });

    it('should deny create', async () => {
        const userId = v1();
        const eventId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`updateClubSalesTasks/${eventId}`).set({})
        );
    });

    it('should deny update', async () => {
        const userId = v1();
        const eventId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`updateClubSalesTasks/${eventId}`).update({})
        );
    });

    it('should deny delete', async () => {
        const userId = v1();
        const eventId = v1();
        const context = testEnv.authenticatedContext(userId);
        await firebase.assertFails(
            context.firestore().doc(`updateClubSalesTasks/${eventId}`).delete()
        );
    });
});

describe('users', () => {
    it('should allow read on own document with user claim', async () => {
        const userId = v1();
        const context = testEnv.authenticatedContext(userId, { isUser: true });
        await firebase.assertSucceeds(context.firestore().doc(`users/${userId}`).get());
    });
});
