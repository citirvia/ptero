import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { applyCreditDelta } from "../lib/billing.js";
import { getClientForUser } from "../lib/pterodactyl/resolve.js";
import { PromoCodeError, resolveBalancePromoCode } from "../lib/promo-codes.js";

export async function accountRoutes(app: FastifyInstance) {
  app.post(
    "/account/promo-codes/redeem",
    {
      preHandler: [app.requireAuth],
      schema: {
        body: z.object({
          couponCode: z.string().trim().min(3).max(32),
        }),
      },
    },
    async (req, reply) => {
      const body = req.body as { couponCode: string };
      try {
        const result = await prisma.$transaction(async (tx) => {
          const resolved = await resolveBalancePromoCode({
            prisma: tx,
            userId: req.user.sub,
            code: body.couponCode,
          });

          const redemption = await tx.promoRedemption.create({
            data: {
              promoCodeId: resolved.promo.id,
              userId: req.user.sub,
              discountCredits: 0,
              creditedBalance: resolved.creditAmount,
            },
            select: { id: true },
          });

          const balanceAfter = await applyCreditDelta({
            prisma: tx,
            userId: req.user.sub,
            amount: resolved.creditAmount,
            type: "PROMO_REDEMPTION",
            description: `Promo code ${resolved.promo.code} redeemed`,
          });

          return {
            redemptionId: redemption.id,
            code: resolved.promo.code,
            amount: resolved.creditAmount,
            balanceAfter,
          };
        });

        return reply.code(200).send({
          ok: true,
          code: result.code,
          amount: result.amount,
          balanceAfter: result.balanceAfter,
        });
      } catch (error) {
        if (error instanceof PromoCodeError) {
          return reply.code(error.statusCode).send({
            error: error.code,
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  app.get(
    "/account",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { pteroClientKeyEnc: true },
      });
      if (!user?.pteroClientKeyEnc) {
        return reply.code(409).send({
          error: "PanelKeyRequired",
          message: "Link a personal panel API key before using account endpoints.",
        });
      }
      const client = await getClientForUser(req.user.sub);
      return { account: await client.account() };
    },
  );

  app.get(
    "/account/api-keys",
    { preHandler: [app.requireAuth] },
    async (req, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { pteroClientKeyEnc: true },
      });
      if (!user?.pteroClientKeyEnc) {
        return reply.code(409).send({
          error: "PanelKeyRequired",
          message: "Link a personal panel API key before using account endpoints.",
        });
      }
      const client = await getClientForUser(req.user.sub);
      return { keys: await client.apiKeys() };
    },
  );
}
