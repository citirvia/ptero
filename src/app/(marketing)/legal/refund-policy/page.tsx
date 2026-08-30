import type { Metadata } from "next";
import { LegalDoc, Bullet, type LegalSection } from "../_components/legal-doc";

export const metadata: Metadata = {
  title: "Refund Policy — Ptero",
  description: "When and how refunds are issued for Ptero services.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        We want you to be confident deploying on Ptero. This Refund Policy
        explains when refunds are available, how to request one, and the
        situations that fall outside refund eligibility. It supplements our{" "}
        <a href="/legal/terms">Terms of Service</a>.
      </p>
    ),
  },
  {
    id: "trial",
    title: "Money-back guarantee",
    body: (
      <p>
        New customers are eligible for a full refund within{" "}
        <strong>7 days</strong> of their first paid invoice, no questions asked.
        This applies once per organization and covers your first subscription
        charge only.
      </p>
    ),
  },
  {
    id: "monthly",
    title: "Monthly subscriptions",
    body: (
      <p>
        Monthly plans renew automatically. You can cancel at any time to stop
        future charges; cancellation takes effect at the end of the current
        billing period. We do not pro-rate or refund partial months once a
        billing cycle has begun, outside of the money-back guarantee above.
      </p>
    ),
  },
  {
    id: "annual",
    title: "Annual subscriptions",
    body: (
      <>
        <p>
          Annual plans may be refunded on a pro-rated basis under the following
          conditions:
        </p>
        <ul>
          <Bullet>The request is made within the first 30 days of the term, or</Bullet>
          <Bullet>
            Ptero discontinues a service you rely on with less than 30
            days&rsquo; notice.
          </Bullet>
        </ul>
        <p>
          Pro-rated refunds are calculated from the date of cancellation, less
          any usage already consumed.
        </p>
      </>
    ),
  },
  {
    id: "credits",
    title: "Service credits & SLA",
    body: (
      <p>
        If we fail to meet our 99.99% monthly uptime SLA, you may be eligible for
        service credits applied to a future invoice. SLA credits are issued as
        account credit rather than cash refunds and must be requested within 30
        days of the affected period.
      </p>
    ),
  },
  {
    id: "non-refundable",
    title: "Non-refundable charges",
    body: (
      <>
        <p>The following are not eligible for refunds:</p>
        <ul>
          <Bullet>Usage-based charges for compute, bandwidth, or storage already consumed.</Bullet>
          <Bullet>One-time setup, migration, or professional-services fees.</Bullet>
          <Bullet>
            Accounts suspended or terminated for violating our{" "}
            <a href="/legal/acceptable-use">Acceptable Use Policy</a>.
          </Bullet>
          <Bullet>Add-ons purchased and provisioned, such as additional backups.</Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "How to request a refund",
    body: (
      <p>
        Email <a href="mailto:billing@ptero.app">billing@ptero.app</a> from the
        address associated with your account, including your organization name
        and the invoice number. Approved refunds are returned to your original
        payment method within 5–10 business days.
      </p>
    ),
  },
  {
    id: "chargebacks",
    title: "Chargebacks",
    body: (
      <p>
        Please contact us before initiating a chargeback — we can usually resolve
        billing issues faster directly. Accounts with unresolved chargebacks may
        be suspended pending review.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Refund Policy"
      intro="Clear, fair refunds. A 7-day money-back guarantee for new customers, pro-rated annual refunds, and SLA service credits — all explained below."
      lastUpdated="May 24, 2026"
      sections={SECTIONS}
    />
  );
}
