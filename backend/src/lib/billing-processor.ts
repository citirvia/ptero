import type { FastifyInstance } from "fastify";
import { prisma } from "./prisma.js";
import { pteroApp } from "./pterodactyl/application.js";
import {
  GRACE_PERIOD_MS,
  addOneMonth,
  applyCreditDelta,
  InsufficientCreditsError,
} from "./billing.js";

const INTERVAL_MS = 60 * 60 * 1000;

async function processSubscription(app: FastifyInstance, subscriptionId: string) {
  const subscription = await prisma.serverSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { id: true, creditBalance: true } } },
  });

  if (!subscription || subscription.status === "CANCELLED") return;

  const now = new Date();
  if (subscription.renewalAt > now) return;

  try {
    await prisma.$transaction(async (tx) => {
      await applyCreditDelta({
        prisma: tx,
        userId: subscription.userId,
        amount: -subscription.monthlyCredits,
        type: "MONTHLY_RENEWAL",
        description: `${subscription.serverName} monthly renewal`,
        serverIdentifier: subscription.serverIdentifier,
      });

      await tx.serverSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          graceEndsAt: null,
          suspendedAt: null,
          lastChargedAt: now,
          renewalAt: addOneMonth(now),
        },
      });
    });

    if (subscription.status === "SUSPENDED") {
      await pteroApp.unsuspendServer(subscription.pteroServerId);
    }
  } catch (error) {
    if (!(error instanceof InsufficientCreditsError)) {
      app.log.warn({ err: error, subscriptionId }, "billing: renewal failed");
      return;
    }

    if (!subscription.graceEndsAt) {
      await prisma.serverSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "GRACE",
          graceEndsAt: new Date(now.getTime() + GRACE_PERIOD_MS),
        },
      });
      return;
    }

    if (subscription.graceEndsAt <= now && subscription.status !== "SUSPENDED") {
      await pteroApp.suspendServer(subscription.pteroServerId);
      await prisma.serverSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "SUSPENDED",
          suspendedAt: now,
        },
      });
    }
  }
}

async function runBillingCycle(app: FastifyInstance) {
  const dueSubscriptions = await prisma.serverSubscription.findMany({
    where: {
      status: { in: ["ACTIVE", "GRACE", "SUSPENDED"] },
      renewalAt: { lte: new Date() },
    },
    select: { id: true },
  });

  for (const subscription of dueSubscriptions) {
    try {
      await processSubscription(app, subscription.id);
    } catch (error) {
      app.log.warn({ err: error, subscriptionId: subscription.id }, "billing: cycle item failed");
    }
  }
}

export function startBillingProcessor(app: FastifyInstance): () => void {
  let stopped = false;

  const loop = async () => {
    while (!stopped) {
      try {
        await runBillingCycle(app);
      } catch (error) {
        app.log.warn({ err: error }, "billing: cycle failed");
      }

      if (stopped) break;
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
    }
  };

  app.log.info("Billing processor started (60m interval).");
  void loop();

  return () => {
    stopped = true;
  };
}

export async function runBillingCycleNow(app: FastifyInstance) {
  await runBillingCycle(app);
}
