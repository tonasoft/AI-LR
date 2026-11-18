import assert from "node:assert/strict";
import test from "node:test";
import { getMetadata, isBlockedAddress, validatePublicUrl } from "./url-preview.js";

const publicDns = async () => [{ address: "93.184.216.34", family: 4 }];

test("extracts metadata from a normal public website", async () => {
  const request = async (url, address) => {
    assert.equal(url.href, "https://example.com/");
    assert.equal(address, "93.184.216.34");
    return {
      statusCode: 200,
      headers: {},
      body: '<html><head><title>Example</title><meta name="description" content="Public site"></head></html>'
    };
  };

  assert.deepEqual(await getMetadata("https://example.com", { resolve: publicDns, request }), {
    title: "Example",
    description: "Public site"
  });
});

test("rejects unsafe URL schemes", async () => {
  for (const url of ["file:///etc/passwd", "ftp://example.com/file", "data:text/plain,hello"]) {
    await assert.rejects(validatePublicUrl(url, publicDns), /unsafe_scheme/);
  }
});

test("rejects local and private IPv4 destinations", async () => {
  for (const address of ["0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.1.1"]) {
    assert.equal(isBlockedAddress(address), true, address);
    await assert.rejects(validatePublicUrl("http://" + address + "/", publicDns), /blocked_address/);
  }
});

test("rejects alternate spellings of loopback IPv4 addresses", async () => {
  for (const url of ["http://127.1/", "http://0x7f000001/", "http://2130706433/"]) {
    await assert.rejects(validatePublicUrl(url, publicDns), /blocked_address/);
  }
});

test("rejects local and private IPv6 destinations", async () => {
  for (const address of ["::", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1"]) {
    assert.equal(isBlockedAddress(address), true, address);
    await assert.rejects(validatePublicUrl("http://[" + address + "]/", publicDns), /blocked_address/);
  }
});

test("rejects hostnames if any DNS answer is private", async () => {
  const mixedDns = async () => [
    { address: "93.184.216.34", family: 4 },
    { address: "127.0.0.1", family: 4 }
  ];

  await assert.rejects(validatePublicUrl("https://example.com", mixedDns), /blocked_address/);
});

test("rejects redirects to blocked destinations before making the redirected request", async () => {
  const requested = [];
  const resolve = async (hostname) => {
    if (hostname === "public.example") return [{ address: "93.184.216.34", family: 4 }];
    if (hostname === "internal.example") return [{ address: "10.0.0.7", family: 4 }];
    throw new Error("unexpected_hostname");
  };
  const request = async (url) => {
    requested.push(url.href);
    return { statusCode: 302, headers: { location: "http://internal.example/admin" }, body: "" };
  };

  await assert.rejects(getMetadata("https://public.example", { resolve, request }), /blocked_address/);
  assert.deepEqual(requested, ["https://public.example/"]);
});

test("rejects redirects to unsafe URL schemes", async () => {
  const request = async () => ({
    statusCode: 302,
    headers: { location: "file:///etc/passwd" },
    body: ""
  });

  await assert.rejects(getMetadata("https://public.example", { resolve: publicDns, request }), /unsafe_scheme/);
});

test("allows redirects between public websites", async () => {
  const requested = [];
  const request = async (url) => {
    requested.push(url.href);
    if (url.hostname === "one.example") {
      return { statusCode: 301, headers: { location: "https://two.example/page" }, body: "" };
    }
    return { statusCode: 200, headers: {}, body: "<title>Destination</title>" };
  };

  assert.deepEqual(await getMetadata("https://one.example", { resolve: publicDns, request }), {
    title: "Destination",
    description: ""
  });
  assert.deepEqual(requested, ["https://one.example/", "https://two.example/page"]);
});
