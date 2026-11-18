import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { availabilityRequests, bookings, eventPlans, payments, quotes } from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, router } from "./_core/trpc";

const demoQuoteValues = {
  venueFeePaise: 1_800_000,
  artistFeePaise: 1_250_000,
  productionFeePaise: 180_000,
  platformFeePaise: 97_000,
  taxPaise: 297_000,
  depositPaise: 1_663_500,
};

const paymentOutcome = z.enum(["success", "failure", "cancelled"]);

export const marketplaceRouter = router({
  createDraft: publicProcedure
    .input(z.object({
      occasion: z.string().trim().min(1).max(100),
      city: z.string().trim().min(1).max(80),
      eventDate: z.string().trim().min(1).max(32),
      guestCount: z.number().int().min(1).max(10000),
      budgetPaise: z.number().int().min(0),
      style: z.string().trim().min(1).max(100),
      selectedVenueId: z.string().trim().min(1).max(64),
      selectedArtistId: z.string().trim().min(1).max(64),
    }))
    .mutation(async ({ input, ctx }) => {
      const eventPlanId = `evt_${nanoid(16)}`;
      const db = await getDb();

      if (!db) {
        return { eventPlanId, persisted: false as const, status: "draft" as const };
      }

      await db.insert(eventPlans).values({
        id: eventPlanId,
        userId: ctx.user?.id ?? null,
        occasion: input.occasion,
        city: input.city,
        eventDate: input.eventDate,
        guestCount: input.guestCount,
        budgetPaise: input.budgetPaise,
        style: input.style,
        selectedVenueId: input.selectedVenueId,
        selectedArtistId: input.selectedArtistId,
        status: "draft",
      });

      return { eventPlanId, persisted: true as const, status: "draft" as const };
    }),

  requestAvailability: publicProcedure
    .input(z.object({
      eventPlanId: z.string().trim().min(1).max(64),
      venueId: z.string().trim().min(1).max(64),
      artistId: z.string().trim().min(1).max(64),
    }))
    .mutation(async ({ input }) => {
      const requestId = `req_${nanoid(16)}`;
      const db = await getDb();

      if (!db) {
        return { requestId, persisted: false as const, status: "pending" as const };
      }

      await db.insert(availabilityRequests).values({
        id: requestId,
        eventPlanId: input.eventPlanId,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      await db.update(eventPlans).set({ status: "requested" }).where(eq(eventPlans.id, input.eventPlanId));

      return { requestId, persisted: true as const, status: "pending" as const };
    }),

  createQuote: publicProcedure
    .input(z.object({ eventPlanId: z.string().trim().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const quoteId = `quote_${nanoid(16)}`;
      const db = await getDb();
      const validUntil = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);

      if (!db) {
        return { quoteId, persisted: false as const, status: "sent" as const, ...demoQuoteValues, validUntil };
      }

      await db.insert(quotes).values({
        id: quoteId,
        eventPlanId: input.eventPlanId,
        ...demoQuoteValues,
        validUntil,
        status: "sent",
      });
      await db.update(eventPlans).set({ status: "quoted" }).where(eq(eventPlans.id, input.eventPlanId));

      return { quoteId, persisted: true as const, status: "sent" as const, ...demoQuoteValues, validUntil };
    }),

  recordSandboxPayment: publicProcedure
    .input(z.object({
      quoteId: z.string().trim().min(1).max(64),
      outcome: paymentOutcome,
    }))
    .mutation(async ({ input }) => {
      const paymentId = `pay_${nanoid(16)}`;
      const idempotencyKey = `sandbox_${nanoid(24)}`;
      const db = await getDb();
      const status = input.outcome === "success" ? "succeeded" : input.outcome === "failure" ? "failed" : "cancelled";

      if (!db) {
        return {
          paymentId,
          bookingId: input.outcome === "success" ? `book_${nanoid(16)}` : null,
          persisted: false as const,
          status,
        };
      }

      const quoteRows = await db.select().from(quotes).where(eq(quotes.id, input.quoteId)).limit(1);
      const quoteRow = quoteRows[0];
      if (!quoteRow) {
        return { paymentId, bookingId: null, persisted: false as const, status: "failed" as const, reason: "quote_not_found" as const };
      }

      await db.insert(payments).values({
        id: paymentId,
        quoteId: input.quoteId,
        amountPaise: quoteRow.depositPaise,
        mode: "sandbox",
        status,
        idempotencyKey,
      });

      if (input.outcome !== "success") {
        return { paymentId, bookingId: null, persisted: true as const, status };
      }

      const existingBooking = await db.select().from(bookings).where(eq(bookings.quoteId, input.quoteId)).limit(1);
      const bookingId = existingBooking[0]?.id ?? `book_${nanoid(16)}`;
      if (!existingBooking[0]) {
        await db.insert(bookings).values({
          id: bookingId,
          eventPlanId: quoteRow.eventPlanId,
          quoteId: input.quoteId,
          paymentId,
          status: "confirmed",
        });
      }
      await db.update(quotes).set({ status: "accepted" }).where(eq(quotes.id, input.quoteId));
      await db.update(eventPlans).set({ status: "confirmed" }).where(eq(eventPlans.id, quoteRow.eventPlanId));

      return { paymentId, bookingId, persisted: true as const, status: "succeeded" as const };
    }),
});
