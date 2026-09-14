import { describe, expect, test } from "bun:test";
import { matchInboundReference } from "./match";
import { parseRevisionRequest, cleanReplyText } from "./parse";
import { verifyWebhookSignature } from "./webhook";
import { classifyReply } from "./intent";
import { composeDesignSpec } from "@/lib/design/compose";

const app = {
  reference: "ORD-TEST01",
  company: "Premium Cars",
  description: "Vi hyr ut lyxbilar till privatpersoner och företag i Stockholm.",
  website_type: "Biluthyrning",
  colors: "rött och svart",
  extra_requests: "Stadsljus och två bilar i bakgrunden",
  file_names: [],
};

describe("inbound matching", () => {
  test("plus-addressed reply wins", () => {
    const m = matchInboundReference({ to: ["reply+ORD-3M8NUN@dinwebbpartner.com"], subject: "Re: hej" });
    expect(m).toEqual({ reference: "ORD-3M8NUN", via: "plus-address" });
  });

  test("subject token is used when no plus address", () => {
    const m = matchInboundReference({ to: ["info@dinwebbpartner.com"], subject: "Re: Din preview ORD-45920N" });
    expect(m?.reference).toBe("ORD-45920N");
  });

  test("thread headers only match message ids we sent", () => {
    const lookup = { "<abc@resend>": "ORD-AAA111" };
    expect(matchInboundReference({ inReplyTo: "<abc@resend>" }, lookup)?.reference).toBe("ORD-AAA111");
    expect(matchInboundReference({ inReplyTo: "<unknown@x>" }, lookup)).toBeNull();
  });

  test("never guesses from sender alone", () => {
    expect(matchInboundReference({ from: "kund@example.com", subject: "ändringar" })).toBeNull();
  });
});

describe("parsing customer wishes", () => {
  test("keeps, adds and resizes", () => {
    const d = parseRevisionRequest("behåll röd/svart men lägg till mer blått och gör rubriken mindre");
    expect(d.keepColors.length).toBeGreaterThan(0);
    expect(d.addColors.length).toBeGreaterThan(0);
    expect(d.headingScale).toBeLessThan(0);
    expect(d.unparsed).toBe(false);
  });

  test("strips quoted history", () => {
    const cleaned = cleanReplyText("Gör rubriken mindre\n\nOn 1 jan skrev Din Webbpartner:\n> gammalt mail");
    expect(cleaned).not.toContain("gammalt mail");
  });
});

describe("directives steer generation", () => {
  test("added colour becomes accent and heading shrinks", () => {
    const base = composeDesignSpec(app as any, { revision: 1 });
    const d = parseRevisionRequest("behåll rött och svart, lägg till mer blått och gör rubriken mindre");
    const next = composeDesignSpec(app as any, { revision: 2, directives: d });
    expect(next.type.scale).toBeLessThan(base.type.scale);
    expect(next.palette.accent).not.toBe(base.palette.accent);
    expect(next.revision).toBe(2);
  });

  test("QA gate still runs on the revised spec", () => {
    const d = parseRevisionRequest("lägg till mer blått");
    const next = composeDesignSpec(app as any, { revision: 3, directives: d });
    expect(next.qa).toBeDefined();
    expect(["ready", "review", "blocked"]).toContain(next.qa!.status);
  });

  test("customer instructions are never rendered verbatim", () => {
    const spec = composeDesignSpec(app as any, { revision: 1 });
    const text = JSON.stringify(spec.sections);
    expect(text).not.toContain("Stadsljus och två bilar i bakgrunden");
    expect(text).not.toContain("Önskemål vi tagit med");
  });
});

describe("webhook auth", () => {
  test("rejects missing secret", async () => {
    const r = await verifyWebhookSignature(undefined, { id: "a", timestamp: "1", signature: "v1,x" }, "{}");
    expect(r).toEqual({ ok: false, reason: "missing_secret" });
  });

  test("rejects a forged signature", async () => {
    const ts = Math.floor(Date.now() / 1000).toString();
    const r = await verifyWebhookSignature("whsec_dGVzdHNlY3JldA==", { id: "msg_1", timestamp: ts, signature: "v1,ZmFrZQ==" }, "{}");
    expect(r.ok).toBe(false);
  });

  test("accepts a correctly signed payload", async () => {
    const secret = "whsec_dGVzdHNlY3JldA==";
    const id = "msg_1";
    const ts = Math.floor(Date.now() / 1000).toString();
    const body = '{"hello":"world"}';
    const key = await crypto.subtle.importKey(
      "raw",
      Uint8Array.from(atob("dGVzdHNlY3JldA=="), (c) => c.charCodeAt(0)) as unknown as ArrayBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
    let binary = "";
    for (const b of mac) binary += String.fromCharCode(b);
    const sig = `v1,${btoa(binary)}`;
    const r = await verifyWebhookSignature(secret, { id, timestamp: ts, signature: sig }, body);
    expect(r.ok).toBe(true);
  });

  test("rejects stale timestamps", async () => {
    const r = await verifyWebhookSignature("whsec_dGVzdHNlY3JldA==", { id: "a", timestamp: "1000", signature: "v1,x" }, "{}");
    expect(r).toEqual({ ok: false, reason: "timestamp_out_of_tolerance" });
  });
});

// --- Design review loop -----------------------------------------------------

describe("classifyReply", () => {
  test("tydligt godkännande", () => {
    expect(classifyReply("Hej! Jag godkänner designen, den ser jättebra ut.").intent).toBe("approved");
    expect(classifyReply("Perfekt som den är, inga ändringar.").intent).toBe("approved");
  });

  test("ändringsönskemål", () => {
    expect(classifyReply("Behåll röd/svart men lägg till mer blått").intent).toBe("changes");
    expect(classifyReply("Kan ni göra rubriken mindre?").intent).toBe("changes");
  });

  test("positivt men med reservation räknas aldrig som godkännande", () => {
    const r = classifyReply("Ser bra ut men jag återkommer");
    expect(r.intent).toBe("unclear");
  });

  test("oklart svar blir aldrig godkännande", () => {
    expect(classifyReply("Tack för mailet.").intent).toBe("unclear");
    expect(classifyReply("").intent).toBe("unclear");
  });
});
