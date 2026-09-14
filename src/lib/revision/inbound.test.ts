import { describe, expect, test } from "bun:test";
import { normalizeInbound, isMetadataOnly, resolveInboundEmail } from "./inbound";
import { matchInboundReference } from "./match";
import { replyAddressFor } from "@/lib/email/reply-address";

const metadataOnly = {
  type: "email.received",
  data: {
    email_id: "em_123",
    to: ["reply+ORD-3M8NUN@reply.dinwebbpartner.com"],
    from: "kund@example.com",
    subject: "Re: Din preview",
  },
};

describe("reply address", () => {
  test("uses the dedicated inbound subdomain", () => {
    expect(replyAddressFor("ord-3m8nun")).toBe("reply+ORD-3M8NUN@reply.dinwebbpartner.com");
  });

  test("plus address on the subdomain still matches the order", () => {
    const m = matchInboundReference({ to: [replyAddressFor("ORD-3M8NUN")] });
    expect(m).toEqual({ reference: "ORD-3M8NUN", via: "plus-address" });
  });
});

describe("resend inbound payloads", () => {
  test("metadata-only payload is detected", () => {
    expect(isMetadataOnly(normalizeInbound(metadataOnly))).toBe(true);
  });

  test("body is fetched from the provider when the webhook lacks it", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: any) => {
      calls.push(String(url));
      return new Response(JSON.stringify({ text: "Lägg till mer blått tack", subject: "Re: Din preview" }), { status: 200 });
    }) as unknown as typeof fetch;

    const { email, fetched, bodyMissing } = await resolveInboundEmail(metadataOnly, { apiKey: "re_test", fetchImpl });
    expect(fetched).toBe(true);
    expect(bodyMissing).toBe(false);
    expect(email.text).toContain("blått");
    expect(calls[0]).toContain("em_123");
  });

  test("missing body is reported instead of silently classified", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 404 })) as unknown as typeof fetch;
    const { bodyMissing } = await resolveInboundEmail(metadataOnly, { apiKey: "re_test", fetchImpl });
    expect(bodyMissing).toBe(true);
  });

  test("full payload is used as-is without any API call", async () => {
    const fetchImpl = (async () => { throw new Error("should not be called"); }) as unknown as typeof fetch;
    const { email, fetched } = await resolveInboundEmail(
      { data: { ...metadataOnly.data, text: "Jag godkänner designen" } },
      { apiKey: "re_test", fetchImpl },
    );
    expect(fetched).toBe(false);
    expect(email.text).toBe("Jag godkänner designen");
  });

  test("array-style headers resolve threading fields", () => {
    const email = normalizeInbound({
      data: {
        id: "em_9",
        headers: [
          { name: "In-Reply-To", value: "<abc@resend>" },
          { name: "References", value: "<abc@resend> <def@resend>" },
        ],
      },
    });
    expect(email.inReplyTo).toBe("<abc@resend>");
    expect(email.references).toEqual(["<abc@resend>", "<def@resend>"]);
    expect(matchInboundReference(email, { "<abc@resend>": "ORD-AAA111" })?.reference).toBe("ORD-AAA111");
  });
});
