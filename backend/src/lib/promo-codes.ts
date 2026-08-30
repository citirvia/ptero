import { prisma, type Prisma } from "./prisma.js";

export class PromoCodeError extends Error {
  statusCode: number;
  code: string;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "PromoCodeError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

type PromoTx = Prisma.TransactionClient | typeof prisma;

export function normalizePromoCode(input: string) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

function calculateDiscount(type: "FIXED_CREDITS" | "PERCENT", amount: number, baseCredits: number) {
  if (baseCredits <= 0) return 0;
  if (type === "PERCENT") {
    return Math.min(baseCredits, Math.floor((baseCredits * amount) / 100));
  }
  return Math.min(baseCredits, amount);
}

async function resolveActivePromo(args: {
  prisma: PromoTx;
  userId: string;
  code: string;
  scope: "DEPLOY_DISCOUNT" | "CREDIT_BALANCE";
}) {
  const normalizedCode = normalizePromoCode(args.code);
  if (!normalizedCode) {
    throw new PromoCodeError("InvalidPromoCode", "Enter a valid promo code.");
  }

  const promo = await args.prisma.promoCode.findUnique({
    where: { code: normalizedCode },
    include: {
      _count: { select: { redemptions: true } },
    },
  });

  if (!promo || !promo.active) {
    throw new PromoCodeError("PromoCodeNotFound", "Promo code was not found.", 404);
  }
  if (promo.scope !== args.scope) {
    const message =
      args.scope === "CREDIT_BALANCE"
        ? "This code can only be used for deploy discounts."
        : "This code can only be redeemed from your coin balance section.";
    throw new PromoCodeError("PromoCodeWrongScope", message, 409);
  }

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) {
    throw new PromoCodeError("PromoCodeNotStarted", "Promo code is not active yet.");
  }
  if (promo.expiresAt && promo.expiresAt < now) {
    throw new PromoCodeError("PromoCodeExpired", "Promo code has expired.");
  }
  if (promo.maxRedemptions !== null && promo.maxRedemptions !== undefined && promo._count.redemptions >= promo.maxRedemptions) {
    throw new PromoCodeError("PromoCodeDepleted", "Promo code has reached its usage limit.");
  }

  const userRedemptions = await args.prisma.promoRedemption.count({
    where: { promoCodeId: promo.id, userId: args.userId },
  });
  if (userRedemptions >= promo.maxPerUser) {
    throw new PromoCodeError("PromoCodeAlreadyUsed", "You already used this promo code.");
  }

  return { promo, normalizedCode };
}

export async function resolvePromoCodeDiscount(args: {
  prisma: PromoTx;
  userId: string;
  code: string;
  baseCredits: number;
}) {
  const { promo, normalizedCode } = await resolveActivePromo({
    prisma: args.prisma,
    userId: args.userId,
    code: args.code,
    scope: "DEPLOY_DISCOUNT",
  });

  const discountCredits = calculateDiscount(promo.type, promo.amount, args.baseCredits);
  if (discountCredits <= 0) {
    throw new PromoCodeError("PromoCodeNoDiscount", "Promo code does not apply to this plan.");
  }

  return {
    promo,
    normalizedCode,
    discountCredits,
    finalCredits: Math.max(0, args.baseCredits - discountCredits),
  };
}

export async function resolveBalancePromoCode(args: {
  prisma: PromoTx;
  userId: string;
  code: string;
}) {
  const { promo, normalizedCode } = await resolveActivePromo({
    prisma: args.prisma,
    userId: args.userId,
    code: args.code,
    scope: "CREDIT_BALANCE",
  });

  if (promo.type !== "FIXED_CREDITS") {
    throw new PromoCodeError(
      "PromoCodeInvalidType",
      "Coin balance promo codes must grant a fixed number of coins.",
      409,
    );
  }

  return {
    promo,
    normalizedCode,
    creditAmount: promo.amount,
  };
}
