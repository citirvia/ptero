import type { Metadata } from "next";
import { LegalDoc, Bullet, type LegalSection } from "../_components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy — Ptero",
  description: "How Ptero collects, uses, and protects your personal data.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        This Privacy Policy explains how Ptero Infrastructure
        (&ldquo;Ptero&rdquo;) collects, uses, and protects information when you
        use our platform, dashboard, API, and website. We are the data
        controller for the personal data described here. We collect the minimum
        we need to run the Services well.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    title: "Data we collect",
    body: (
      <>
        <p>We collect the following categories of data:</p>
        <ul>
          <Bullet>
            <strong>Account data</strong> — name, email, organization, and
            authentication details.
          </Bullet>
          <Bullet>
            <strong>Billing data</strong> — payment method tokens and invoice
            history (card numbers are handled by our PCI-compliant processor, not
            stored by us).
          </Bullet>
          <Bullet>
            <strong>Usage & telemetry</strong> — resource metrics, deploy logs,
            and audit events needed to operate and secure your servers.
          </Bullet>
          <Bullet>
            <strong>Device & log data</strong> — IP address, browser type, and
            request logs for security and abuse prevention.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your data",
    body: (
      <ul>
        <Bullet>To provision, operate, and secure your servers and account.</Bullet>
        <Bullet>To process payments and send billing communications.</Bullet>
        <Bullet>To detect, investigate, and prevent abuse and fraud.</Bullet>
        <Bullet>To provide support and respond to your requests.</Bullet>
        <Bullet>
          To send product and service announcements (you can opt out of
          marketing at any time).
        </Bullet>
      </ul>
    ),
  },
  {
    id: "legal-bases",
    title: "Legal bases for processing",
    body: (
      <p>
        Where the GDPR applies, we process personal data on the bases of
        performance of a contract (operating the Services), legitimate interests
        (security, product improvement), legal obligation (tax, accounting), and
        consent (optional marketing).
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Sharing & subprocessors",
    body: (
      <p>
        We do not sell your personal data. We share data only with vetted
        subprocessors who help us deliver the Services — such as our payment
        processor, email provider, and cloud monitoring tools — each under a
        data processing agreement. A current list of subprocessors is available
        on request.
      </p>
    ),
  },
  {
    id: "retention",
    title: "Data retention",
    body: (
      <p>
        We retain account and billing data for as long as your account is active
        and for a limited period afterward to meet legal and accounting
        obligations. Server data is deleted within 14 days of account closure
        unless you request earlier deletion.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on your location, you may have the right to access, correct,
          export, or delete your personal data, and to object to or restrict
          certain processing.
        </p>
        <ul>
          <Bullet>
            Exercise these rights from account settings or by emailing{" "}
            <a href="mailto:privacy@ptero.app">privacy@ptero.app</a>.
          </Bullet>
          <Bullet>
            We will respond within 30 days and will not discriminate against you
            for exercising your rights.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We protect data with encryption in transit and at rest, scoped access
        controls, audit logging, and always-on DDoS mitigation. No system is
        perfectly secure, but we work continuously to safeguard your information
        and will notify you of any breach affecting your data as required by
        law.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Your data may be processed in the EU, US, and Turkey where our
        datacenters operate. Where data crosses borders, we rely on appropriate
        safeguards such as Standard Contractual Clauses.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        For privacy questions or to exercise your rights, contact our Data
        Protection team at{" "}
        <a href="mailto:privacy@ptero.app">privacy@ptero.app</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We collect the minimum data needed to run Ptero reliably and securely. This policy explains what we collect, why, and the controls you have over it."
      lastUpdated="May 24, 2026"
      sections={SECTIONS}
    />
  );
}
