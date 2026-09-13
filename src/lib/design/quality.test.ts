import { describe, expect, it } from "bun:test";
import { composeDesignSpec } from "./compose";
import { evaluateQuality, previewSendGate } from "./quality";

const base = {
  reference: "TEST-QA-001",
  company: "Premium Cars",
  description: "Vi hyr ut lyxbilar till privatpersoner och företag i Stockholm.",
  website_type: "Biluthyrning",
  colors: "rött, svart",
  extra_requests: "Lyxig design med stadsljus och två bilar i bakgrunden. Mörk stil.",
  email: "kontakt@example-company.se",
  phone: "070-000 00 00",
  file_names: [] as string[],
};

describe("preview QA gate", () => {
  it("evaluates a generated spec and reports a status", () => {
    const spec = composeDesignSpec(base);
    const qa = evaluateQuality(spec);
    expect(["ready", "review", "blocked"]).toContain(qa.status);
    expect(qa.checks.length).toBeGreaterThan(10);
    expect(qa.evaluatedAt).toBeTruthy();
  });

  it("hard-fails when an internal screenshot is used as website media", () => {
    const spec = composeDesignSpec({
      ...base,
      file_names: ["ORD-1/Skärmavbild 2026-01-01 kl. 10.00.00.png"],
    });
    const qa = evaluateQuality(spec);
    expect(qa.checks.find((c) => c.id === "media-safety")?.level).not.toBe("fail");
    expect(spec.images.every((i) => i.role !== "hero" || !/Skärmavbild/i.test(i.name))).toBe(true);
  });

  it("blocks sending for blocked previews", () => {
    const gate = previewSendGate(
      { status: "blocked", checks: [{ id: "x", label: "Relevanta bilder", level: "fail" }] },
      true,
    );
    expect(gate.sendable).toBe(false);
  });

  it("requires explicit acceptance for review previews", () => {
    expect(previewSendGate({ status: "review", checks: [] }, false).sendable).toBe(false);
    expect(previewSendGate({ status: "review", checks: [] }, true).sendable).toBe(true);
  });

  it("allows ready previews", () => {
    expect(previewSendGate({ status: "ready", checks: [] }, false).sendable).toBe(true);
  });
});
