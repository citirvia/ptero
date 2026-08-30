import type { Metadata } from "next";
import { LegalDoc, Bullet, type LegalSection } from "../_components/legal-doc";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Ptero",
  description: "The rules for what you can and cannot run on Ptero.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p>
        This Acceptable Use Policy (&ldquo;AUP&rdquo;) describes activities that
        are prohibited on the Ptero platform. It exists to keep our
        infrastructure fast, secure, and reliable for everyone. It applies to
        all customers and forms part of our{" "}
        <a href="/legal/terms">Terms of Service</a>.
      </p>
    ),
  },
  {
    id: "prohibited",
    title: "Prohibited activities",
    body: (
      <>
        <p>You may not use the Services to:</p>
        <ul>
          <Bullet>
            Host or distribute malware, ransomware, spyware, or command-and-control
            servers for botnets.
          </Bullet>
          <Bullet>
            Launch or participate in network attacks, including DoS/DDoS,
            port scanning, or brute-force attempts against third parties.
          </Bullet>
          <Bullet>
            Send unsolicited bulk messages (spam) or operate services designed to
            facilitate spam or phishing.
          </Bullet>
          <Bullet>
            Mine cryptocurrency or run other deliberately resource-exhausting
            workloads without prior written approval.
          </Bullet>
          <Bullet>
            Infringe intellectual property or distribute pirated or illegally
            obtained content.
          </Bullet>
          <Bullet>
            Store or transmit content that is unlawful, including CSAM, which we
            report to the relevant authorities without exception.
          </Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "network",
    title: "Network & resource abuse",
    body: (
      <>
        <p>
          To protect shared infrastructure, the following are not permitted
          without an Enterprise agreement:
        </p>
        <ul>
          <Bullet>Open relays, public proxies, VPN exit nodes, or Tor relays.</Bullet>
          <Bullet>Sustained traffic patterns that degrade neighboring workloads.</Bullet>
          <Bullet>Circumventing plan resource limits or rate limits.</Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "discord",
    title: "Bot & automation conduct",
    body: (
      <p>
        Bots hosted on Ptero must comply with the platform policies of the
        services they connect to, including the Discord Developer Terms and
        Discord API rate limits. Self-bots, mass-DM tooling, and engagement-spam
        bots are prohibited.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security & vulnerability testing",
    body: (
      <p>
        You may test the security of your own workloads. You may not attempt to
        probe, scan, or breach Ptero infrastructure or other customers&rsquo;
        servers. Responsible disclosure of vulnerabilities in our platform is
        welcomed at{" "}
        <a href="mailto:security@ptero.app">security@ptero.app</a>.
      </p>
    ),
  },
  {
    id: "enforcement",
    title: "Enforcement",
    body: (
      <>
        <p>
          When we identify a violation, our response is proportional to the
          severity and may include:
        </p>
        <ul>
          <Bullet>A warning and a request to remediate within a set window.</Bullet>
          <Bullet>Throttling or temporary suspension of the offending workload.</Bullet>
          <Bullet>Immediate suspension for severe or illegal activity.</Bullet>
          <Bullet>Account termination and, where required, referral to authorities.</Bullet>
        </ul>
      </>
    ),
  },
  {
    id: "reporting",
    title: "Reporting abuse",
    body: (
      <p>
        To report a violation of this policy by a workload hosted on Ptero,
        contact <a href="mailto:abuse@ptero.app">abuse@ptero.app</a> with as much
        detail as possible, including relevant IP addresses and timestamps.
      </p>
    ),
  },
];

export default function AcceptableUsePage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Acceptable Use Policy"
      intro="A short list of things you can't run on Ptero — designed to keep the platform fast, secure, and reliable for everyone deploying on it."
      lastUpdated="May 24, 2026"
      sections={SECTIONS}
    />
  );
}
