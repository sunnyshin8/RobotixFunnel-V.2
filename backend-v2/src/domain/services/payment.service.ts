import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "../../infrastructure/database/connection.js";
import {
    carts,
    paymentCollections,
    paymentSessions
} from "../../infrastructure/database/schema/index.js";
import { StripeService } from "../../infrastructure/external/stripe.service.js";

// Initialize Stripe Service - ideally injected
const stripeService = new StripeService();

export class PaymentService {

    async createPaymentCollection(cartId: string, regionId: string, currencyCode: string, amount: number) {
        // Check existing
        const [existing] = await db
            .select()
            .from(paymentCollections)
            .where(and(eq(paymentCollections.cartId, cartId), eq(paymentCollections.status, "not_paid")))
            .limit(1);

        if (existing) return existing;

        const id = `pay_col_${nanoid()}`;
        await db.insert(paymentCollections).values({
            id,
            cartId,
            currencyCode,
            amount,
            status: "not_paid",
        });

        // Update cart
        await db.update(carts).set({ paymentCollectionId: id }).where(eq(carts.id, cartId));

        return { id, cartId, currencyCode, amount, status: "not_paid" };
    }

    async createPaymentSession(paymentCollectionId: string, providerId: string) {
        const [collection] = await db
            .select()
            .from(paymentCollections)
            .where(eq(paymentCollections.id, paymentCollectionId))
            .limit(1);

        if (!collection) throw new Error("Payment collection not found");

        // For Stripe
        if (providerId === "stripe") {
            // Check if session exists
            const [existingSession] = await db
                .select()
                .from(paymentSessions)
                .where(and(eq(paymentSessions.paymentCollectionId, collection.id), eq(paymentSessions.providerId, "stripe")))
                .limit(1);

            if (existingSession) {
                return existingSession;
            }

            // Create Stripe Payment Intent
            const intent = await stripeService.createPaymentIntent(
                collection.amount,
                collection.currencyCode,
                { payment_collection_id: collection.id }
            );

            const sessionId = `pay_sess_${nanoid()}`;
            await db.insert(paymentSessions).values({
                id: sessionId,
                paymentCollectionId: collection.id,
                providerId: "stripe",
                amount: collection.amount,
                currencyCode: collection.currencyCode,
                status: "pending",
                data: { client_secret: intent.client_secret, payment_intent_id: intent.id },
            });

            return {
                id: sessionId,
                payment_collection_id: collection.id,
                provider_id: "stripe",
                amount: collection.amount,
                currency_code: collection.currencyCode,
                status: "pending",
                data: { client_secret: intent.client_secret, payment_intent_id: intent.id },
            };
        }

        // Generic manual/on-chain session for MVP providers (no external intent)
        const supportedManualProviders = ["base-crypto", "pp_system_default", "cod"];
        if (supportedManualProviders.includes(providerId)) {
            const [existingManualSession] = await db
                .select()
                .from(paymentSessions)
                .where(
                    and(
                        eq(paymentSessions.paymentCollectionId, collection.id),
                        eq(paymentSessions.providerId, providerId)
                    )
                )
                .limit(1);

            if (existingManualSession) {
                return {
                    id: existingManualSession.id,
                    payment_collection_id: existingManualSession.paymentCollectionId,
                    provider_id: existingManualSession.providerId,
                    amount: existingManualSession.amount,
                    currency_code: existingManualSession.currencyCode,
                    status: existingManualSession.status,
                    data: existingManualSession.data,
                };
            }

            const sessionId = `pay_sess_${nanoid()}`;
            await db.insert(paymentSessions).values({
                id: sessionId,
                paymentCollectionId: collection.id,
                providerId,
                amount: collection.amount,
                currencyCode: collection.currencyCode,
                status: "pending",
                data: {},
            });

            return {
                id: sessionId,
                payment_collection_id: collection.id,
                provider_id: providerId,
                amount: collection.amount,
                currency_code: collection.currencyCode,
                status: "pending",
                data: {},
            };
        }

        throw new Error(`Provider ${providerId} not supported`);
    }

    async getPaymentCollectionWithSync(id: string) {
        const [collection] = await db
            .select()
            .from(paymentCollections)
            .where(eq(paymentCollections.id, id))
            .limit(1);

        if (!collection) return null;

        // Get sessions
        const sessions = await db
            .select()
            .from(paymentSessions)
            .where(eq(paymentSessions.paymentCollectionId, id));

        // Sync with provider if needed
        const syncedSessions = await Promise.all(sessions.map(async (session) => {
            if (session.providerId === "stripe" && session.status === "pending") {
                try {
                    const paymentIntentId = (session.data as any)?.payment_intent_id;
                    if (paymentIntentId) {
                        const intent = await stripeService.retrievePaymentIntent(paymentIntentId);

                        // Map Stripe status to internal status
                        let status = "pending";
                        if (intent.status === "succeeded") status = "authorized";
                        if (intent.status === "canceled") status = "canceled";

                        if (status !== session.status) {
                            await db.update(paymentSessions)
                                .set({ status, updatedAt: new Date() })
                                .where(eq(paymentSessions.id, session.id));
                            session.status = status;
                        }
                    }
                } catch (e) {
                    console.error("Failed to sync session", session.id, e);
                }
            }
            return session;
        }));

        return {
            id: collection.id,
            amount: collection.amount,
            currency_code: collection.currencyCode,
            status: collection.status,
            payment_sessions: syncedSessions.map(s => ({
                id: s.id,
                provider_id: s.providerId,
                status: s.status,
                amount: s.amount,
                currency_code: s.currencyCode,
                data: s.data
            }))
        };
    }
}
