import type { Prisma, PrismaClient, CreditLedgerType } from "@prisma/client";

const txHost = (tx?: Prisma.TransactionClient) => tx;

export const CREDIT_RATES = {
  ramPerGb: 40,
  cpuPerCore: 25,
  diskPer10Gb: 8,
  database: 3,
  backup: 2,
} as const;

export const GRACE_PERIOD_MS = 2 * 24 * 60 * 60 * 1000;

export type CreditSpec = {
  memoryMb: number;
  cpuPct: number;
  diskMb: number;
  databases?: number;
  backups?: number;
};

export class InsufficientCreditsError extends Error {
  constructor(message = "Insufficient credits.") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export function calculateMonthlyCredits(spec: CreditSpec): number {
  const ramGb = spec.memoryMb / 1024;
  const cpuCores = spec.cpuPct / 100;
  const disk10Gb = spec.diskMb / 1024 / 10;

  const total =
    ramGb * CREDIT_RATES.ramPerGb
    + cpuCores * CREDIT_RATES.cpuPerCore
    + disk10Gb * CREDIT_RATES.diskPer10Gb
    + (spec.databases ?? 0) * CREDIT_RATES.database
    + (spec.backups ?? 0) * CREDIT_RATES.backup;

  return Math.max(1, Math.ceil(total));
}

export function addOneMonth(from: Date): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

export async function applyCreditDelta(args: {
  prisma: PrismaClient | Prisma.TransactionClient;
  userId: string;
  amount: number;
  type: CreditLedgerType;
  description?: string;
  serverIdentifier?: string;
}) {
  const db = txHost(args.prisma) ?? args.prisma;
  const user = await db.user.findUniqueOrThrow({
    where: { id: args.userId },
    select: { creditBalance: true },
  });

  const nextBalance = user.creditBalance + args.amount;
  if (nextBalance < 0) {
    throw new InsufficientCreditsError("Insufficient credits. Please add balance first.");
  }

  await db.user.update({
    where: { id: args.userId },
    data: { creditBalance: nextBalance },
  });

  await db.creditLedger.create({
    data: {
      userId: args.userId,
      amount: args.amount,
      balanceAfter: nextBalance,
      type: args.type,
      description: args.description,
      serverIdentifier: args.serverIdentifier,
    },
  });

  return nextBalance;
}

export async function grantSignupBonusIfEligible(args: {
  prisma: PrismaClient;
  userId: string;
}) {
  const config = await args.prisma.appConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
    select: { signupBonusCredits: true },
  });

  if (config.signupBonusCredits <= 0) {
    return 0;
  }

  return args.prisma.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: {
        id: args.userId,
        signupBonusGrantedAt: null,
      },
      data: {
        signupBonusGrantedAt: new Date(),
      },
    });

    if (claimed.count === 0) {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: args.userId },
        select: { creditBalance: true },
      });
      return user.creditBalance;
    }

    return applyCreditDelta({
      prisma: tx,
      userId: args.userId,
      amount: config.signupBonusCredits,
      type: "INITIAL_GRANT",
      description: "Signup bonus",
    });
  });
}
