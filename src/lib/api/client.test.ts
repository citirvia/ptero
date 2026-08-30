import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, consoleSocketUrl } from "./client";

describe("api client auth transport", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses cookies instead of an Authorization header", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch<{ ok: boolean }>("/health");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.credentials).toBe("include");
    expect(init?.headers).not.toHaveProperty("Authorization");
  });

  it("does not place auth material in the console websocket URL", () => {
    expect(consoleSocketUrl("srv_123")).toBe("/api/servers/srv_123/console");
    expect(consoleSocketUrl("srv_123")).not.toContain("token=");
  });
});
