import { describe, it, expect } from "vitest";
import {
  cn,
  formatBytes,
  formatNumber,
  formatCurrency,
  formatUptime,
  relativeTime,
} from "./utils";

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes under 1 KB", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1024 * 1024 * 2.5)).toBe("2.5 MB");
  });

  it("formats gigabytes and terabytes", () => {
    expect(formatBytes(1024 ** 3)).toBe("1 GB");
    expect(formatBytes(1024 ** 4)).toBe("1 TB");
  });

  it("respects the decimals argument", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1234567, 2)).toBe("1.18 MB");
  });

  it("strips trailing zeros via parseFloat", () => {
    expect(formatBytes(2048)).toBe("2 KB");
  });
});

describe("formatNumber", () => {
  it("returns small numbers as-is", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with a K suffix", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(12345)).toBe("12.3K");
  });

  it("formats millions with an M suffix", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(2_500_000)).toBe("2.5M");
  });

  it("handles the boundary at exactly 1000", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1.0K");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default with two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats other currencies", () => {
    expect(formatCurrency(1000, "EUR")).toBe("€1,000.00");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });
});

describe("formatUptime", () => {
  it("formats minutes only", () => {
    expect(formatUptime(0)).toBe("0m");
    expect(formatUptime(59)).toBe("0m");
    expect(formatUptime(60)).toBe("1m");
    expect(formatUptime(125)).toBe("2m");
  });

  it("formats hours and minutes", () => {
    expect(formatUptime(3600)).toBe("1h 0m");
    expect(formatUptime(3660)).toBe("1h 1m");
  });

  it("formats days, hours, and minutes", () => {
    expect(formatUptime(86400)).toBe("1d 0h 0m");
    expect(formatUptime(90061)).toBe("1d 1h 1m");
  });
});

describe("cn (tailwind-merge dedupe)", () => {
  it("joins multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("dedupes conflicting tailwind utilities, last one wins", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-ink", "text-ink-muted")).toBe("text-ink-muted");
  });

  it("handles conditional/falsy values via clsx", () => {
    expect(cn("base", false && "hidden", null, undefined, "active")).toBe(
      "base active",
    );
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("returns an empty string with no meaningful input", () => {
    expect(cn()).toBe("");
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("relativeTime", () => {
  it("produces a seconds-ago suffix for a recent date", () => {
    const d = new Date(Date.now() - 5000);
    expect(relativeTime(d)).toMatch(/^\d+s ago$/);
  });

  it("produces a minutes-ago suffix", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(relativeTime(d)).toMatch(/^\d+m ago$/);
  });

  it("produces an hours-ago suffix", () => {
    const d = new Date(Date.now() - 5 * 60 * 60 * 1000);
    expect(relativeTime(d)).toMatch(/^\d+h ago$/);
  });

  it("produces a days-ago suffix", () => {
    const d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(relativeTime(d)).toMatch(/^\d+d ago$/);
  });

  it("produces a months-ago suffix for distant dates", () => {
    const d = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    expect(relativeTime(d)).toMatch(/^\d+mo ago$/);
  });
});
