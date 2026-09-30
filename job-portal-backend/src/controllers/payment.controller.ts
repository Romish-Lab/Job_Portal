import { Request, Response } from "express";
import Stripe from "stripe";
import Job from "../models/job.model";
import Payment from "../models/payment.model";
import User from "../models/user.model";
import { getStripe } from "../utils/stripe";
import { getPricing, priceForDuration } from "../utils/adPricing";
import { isPubliclyVisible } from "../utils/adState";

const DAY_MS = 24 * 60 * 60 * 1000;

// Price list shown on the "Pay for advertisement" page
export const getAdPricing = async (_req: Request, res: Response) => {
  const pricing = await getPricing();
  res.status(200).json({ currency: pricing.currency, tiers: pricing.tiers });
};

// Employer starts a Stripe Checkout for one of THEIR approved jobs.
// The client sends only jobId + days; the price is looked up on the server.
export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { jobId, days } = req.body;
    const durationDays = Number(days);

    const job = await Job.findOne({ _id: jobId, employer: req.user?.id });
    if (!job) return res.status(404).json({ message: "Job not found or not yours" });

    if (job.approvalStatus !== "approved" && job.approvalStatus !== "expired") {
      return res.status(409).json({
        message:
          job.approvalStatus === "pending"
            ? "This job is still waiting for admin approval."
            : "This job was rejected and can't be advertised.",
      });
    }
    if (isPubliclyVisible(job)) {
      return res.status(409).json({ message: "This job already has an active advertisement." });
    }

    const price = await priceForDuration(durationDays);
    if (!price) return res.status(400).json({ message: "Invalid advertisement duration" });

    const employer = await User.findById(req.user?.id).select("email");
    const stripe = getStripe();

    // Close any earlier unfinished checkout for this job so it can't be paid twice
    const stale = await Payment.find({ job: job._id, status: "pending" });
    for (const p of stale) {
      if (p.stripeSessionId) {
        try {
          await stripe.checkout.sessions.expire(p.stripeSessionId);
        } catch {
          /* already expired/completed */
        }
      }
      p.status = "expired";
      await p.save();
    }

    const payment = await Payment.create({
      job: job._id,
      employer: req.user?.id,
      amount: price.amount,
      currency: price.currency,
      durationDays: price.days,
      status: "pending",
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: employer?.email,
      client_reference_id: String(payment._id),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: price.currency,
            unit_amount: price.amount,
            product_data: {
              name: `Job advertisement: ${job.title}`,
              description: `${price.days}-day listing`,
            },
          },
        },
      ],
      metadata: {
        paymentId: String(payment._id),
        jobId: String(job._id),
        employerId: String(req.user?.id),
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancelled?job=${job._id}`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });

    payment.stripeSessionId = session.id;
    await payment.save();

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      message: "Couldn't start the payment",
      error: (error as Error).message,
    });
  }
};

// Activates the advertisement for a paid Checkout Session.
// Idempotent: the webhook and /confirm can both call it, in any order, any number of times.
export const activateFromSession = async (
  session: Stripe.Checkout.Session
): Promise<"activated" | "already" | "not_paid" | "invalid"> => {
  const paymentId = session.metadata?.paymentId;
  if (!paymentId) return "invalid";

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.stripeSessionId !== session.id) return "invalid";

  // Only Stripe's own confirmation counts
  if (session.payment_status !== "paid") return "not_paid";

  // Amount and currency must match what WE calculated
  if (
    session.amount_total !== payment.amount ||
    (session.currency || "").toLowerCase() !== payment.currency
  ) {
    console.error(`Payment ${paymentId}: amount/currency mismatch, not activating`);
    payment.status = "failed";
    await payment.save();
    return "invalid";
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + payment.durationDays * DAY_MS);

  // Atomically flip pending -> paid exactly once
  const first = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: "paid" } },
    {
      status: "paid",
      paidAt: now,
      adStartDate: now,
      adExpiryDate: expiry,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : undefined,
    },
    { new: true }
  );
  const paid = first ?? (await Payment.findById(payment._id));
  if (!paid || !paid.adStartDate || !paid.adExpiryDate) return "invalid";

  // (Re)apply to the job. Safe to repeat: skipped if the job already has this or a later expiry.
  const updated = await Job.updateOne(
    {
      _id: paid.job,
      $or: [{ adExpiryDate: null }, { adExpiryDate: { $lt: paid.adExpiryDate } }],
    },
    {
      $set: {
        approvalStatus: "approved", // also revives an expired job
        paymentStatus: "paid",
        adDuration: paid.durationDays,
        adStartDate: paid.adStartDate,
        adExpiryDate: paid.adExpiryDate,
        isActive: true,
      },
    }
  );

  return first || updated.modifiedCount > 0 ? "activated" : "already";
};

// Stripe -> our server. Mounted in server.ts with express.raw() BEFORE express.json().
export const stripeWebhook = async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!secret || !signature) return res.status(400).send("Webhook not configured");

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error("Webhook signature check failed:", (err as Error).message);
    return res.status(400).send("Invalid signature");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const outcome = await activateFromSession(session);
        console.log(`[stripe] ${event.type} ${session.id} -> ${outcome}`);
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.paymentId;
        if (paymentId) {
          const p = await Payment.findOneAndUpdate(
            { _id: paymentId, status: { $ne: "paid" } },
            { status: "failed" }
          );
          if (p) {
            await Job.updateOne(
              { _id: p.job, paymentStatus: { $ne: "paid" } },
              { $set: { paymentStatus: "failed" } }
            );
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.paymentId;
        if (paymentId) {
          await Payment.updateOne(
            { _id: paymentId, status: "pending" },
            { status: "expired" }
          );
        }
        break;
      }
      default:
        break;
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    res.status(500).send("Handler error"); // Stripe will retry
  }
};

// Called by the success page. It does NOT trust the browser: it asks Stripe
// directly whether the session was paid. This covers the case where the webhook
// is delayed (or the Stripe CLI isn't running in local development).
export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const payment = await Payment.findOne({
      stripeSessionId: sessionId,
      employer: req.user?.id,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (payment.status !== "paid") {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      await activateFromSession(session);
    }

    const fresh = await Payment.findById(payment._id);
    res.status(200).json({
      status: fresh?.status,
      jobId: payment.job,
      adExpiryDate: fresh?.adExpiryDate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Couldn't verify the payment",
      error: (error as Error).message,
    });
  }
};
