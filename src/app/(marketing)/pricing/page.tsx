import type { Metadata } from "next";
import { PricingInteractive } from "./_components/pricing-interactive";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Bare-metal Ryzen hosting for Discord bots, Node, and Python — transparent per-plan pricing with no hidden egress fees.",
};

export default function PricingPage() {
  return <PricingInteractive />;
}
