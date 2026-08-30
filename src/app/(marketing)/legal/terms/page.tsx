import type { Metadata } from "next";
import { LegalDoc, Bullet, type LegalSection } from "../_components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service — Ptero",
  description: "The terms that govern your use of the Ptero platform.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to terms",
    body: (
      <>
        <p>
          These Terms of Service (the &ldquo;Terms&rdquo;) form a binding
          agreement between you and Ptero Infrastructure (&ldquo;Ptero&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) and govern your access to and use
          of the Ptero platform, dashboard, API, and related services
          (collectively, the &ldquo;Services&rdquo;).
        </p>
        <p>
          By creating an account, deploying a server, or otherwise using the
          Services, you agree to be bound by these Terms. If you are using the
          Services on behalf of an organization, you represent that you have
          authority to bind that organization.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts & eligibility",
    body: (
      <>
        <p>
          You must be at least 16 years old to use the Services. You are
          responsible for safeguarding your account credentials and for all
          activity that occurs under your account.
        </p>
        <ul>
          <Bullet>Provide accurate, current registration information.</Bullet>
          <Bullet>
            Keep API keys and passwords confidential; rotate any credential you
            believe has been exposed.
          </Bullet>
          <Bullet>
            Notify us promptly at{" "}
            <a href="mailto:security@ptero.app">security@ptero.app</a> of any
            unauthorized access.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "Acceptable use",
    body: (
      <p>
        Your use of the Services is subject to our{" "}
        <a href="/legal/acceptable-use">Acceptable Use Policy</a>. You may not
        use the Services to host malware, conduct attacks, infringe intellectual
        property, or violate applicable law. We may suspend workloads that
        threaten the stability or security of our infrastructure.
      </p>
    ),
  },
  {
    id: "billing",
    title: "Plans, billing & taxes",
    body: (
      <>
        <p>
          Paid plans are billed in advance on a monthly or annual basis. By
          providing a payment method, you authorize us to charge the applicable
          fees plus any taxes.
        </p>
        <ul>
          <Bullet>Fees are non-refundable except as set out in our Refund Policy.</Bullet>
          <Bullet>
            We may change pricing with at least 30 days&rsquo; notice; changes
            take effect on your next billing cycle.
          </Bullet>
          <Bullet>
            Failure to pay may result in suspension or termination of affected
            servers.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "availability",
    title: "Service availability",
    body: (
      <p>
        We target 99.99% monthly uptime for compute nodes as described in our
        SLA. The Services are otherwise provided on an &ldquo;as available&rdquo;
        basis. Scheduled maintenance is communicated in advance through our
        status page wherever practical.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        We retain all rights to the Services, including the dashboard, API, and
        documentation. You retain all rights to the code, data, and content you
        deploy (&ldquo;Your Content&rdquo;). You grant us a limited license to
        host and process Your Content solely to operate the Services.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        You may cancel at any time from the dashboard. We may suspend or
        terminate your access for material breach of these Terms, non-payment,
        or activity that endangers our infrastructure. Upon termination, we will
        make your data available for export for 14 days before deletion.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers & limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, the Services are provided
        without warranties of any kind. Our aggregate liability arising out of
        or relating to the Services will not exceed the amounts you paid to us in
        the twelve months preceding the event giving rise to the claim.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be
        announced by email or in-product notice at least 30 days before they
        take effect. Continued use after changes become effective constitutes
        acceptance.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your access to and use of Ptero. Please read them carefully — they describe your rights, responsibilities, and the limits of our liability."
      lastUpdated="May 24, 2026"
      sections={SECTIONS}
    />
  );
}
