import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { load } from "cheerio";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 1024 * 1024;

const parseIpv4 = (address) => {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return null;
  }
  return octets;
};

const isBlockedIpv4 = (address) => {
  const octets = parseIpv4(address);
  if (!octets) return true;

  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
};

const expandIpv6 = (address) => {
  let normalized = address.toLowerCase().split("%")[0];
  const lastColon = normalized.lastIndexOf(":");
  const ipv4Tail = normalized.slice(lastColon + 1);

  if (ipv4Tail.includes(".")) {
    const octets = parseIpv4(ipv4Tail);
    if (!octets) return null;
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    normalized = normalized.slice(0, lastColon) + ":" + high + ":" + low;
  }

  const halves = normalized.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return null;

  const parts = [...left, ...Array(missing).fill("0"), ...right];
  if (parts.length !== 8 || parts.some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  return parts.map((part) => Number.parseInt(part, 16));
};

const isBlockedIpv6 = (address) => {
  const parts = expandIpv6(address);
  if (!parts) return true;

  const [first, second, third, fourth, fifth, sixth] = parts;
  const isIpv4Mapped = first === 0 && second === 0 && third === 0 && fourth === 0 && fifth === 0 && sixth === 0xffff;
  if (isIpv4Mapped) {
    const ipv4 = (parts[6] >> 8) + "." + (parts[6] & 0xff) + "." + (parts[7] >> 8) + "." + (parts[7] & 0xff);
    return isBlockedIpv4(ipv4);
  }

  const isGlobalUnicast = first >= 0x2000 && first <= 0x3fff;
  const isDocumentation = first === 0x2001 && second === 0x0db8;
  return !isGlobalUnicast || isDocumentation;
};

export const isBlockedAddress = (address) => {
  const family = net.isIP(address);
  if (family === 4) return isBlockedIpv4(address);
  if (family === 6) return isBlockedIpv6(address);
  return true;
};

const defaultResolve = (hostname) => dns.lookup(hostname, { all: true, verbatim: true });

export const validatePublicUrl = async (input, resolve = defaultResolve) => {
  let url;
  try {
    url = input instanceof URL ? new URL(input.href) : new URL(input);
  } catch {
    throw new Error("invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("unsafe_scheme");
  }
  if (url.username || url.password) {
    throw new Error("url_credentials_not_allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = net.isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolve(hostname);

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("dns_lookup_failed");
  }
  if (addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error("blocked_address");
  }

  return { url, addresses };
};

const requestPage = (url, address, { signal, maxBytes = MAX_RESPONSE_BYTES } = {}) =>
  new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const family = net.isIP(address);
    const lookup = (_hostname, options, callback) => {
      if (options?.all) {
        callback(null, [{ address, family }]);
      } else {
        callback(null, address, family);
      }
    };

    const request = transport.request(
      url,
      {
        method: "GET",
        signal,
        lookup,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "identity",
          "User-Agent": "AI-Launch-Roast/1.0"
        }
      },
      (response) => {
        const chunks = [];
        let size = 0;

        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > maxBytes) {
            response.destroy(new Error("response_too_large"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
        response.on("error", reject);
      }
    );

    request.on("error", reject);
    request.end();
  });

export const getMetadata = async (
  input,
  { resolve = defaultResolve, request = requestPage, timeoutMs = 6000, maxRedirects = MAX_REDIRECTS } = {}
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let current = input;
    for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
      const { url, addresses } = await validatePublicUrl(current, resolve);
      const response = await request(url, addresses[0].address, { signal: controller.signal });

      if (REDIRECT_STATUSES.has(response.statusCode)) {
        const location = response.headers.location;
        if (!location || redirects === maxRedirects) {
          throw new Error("redirect_failed");
        }
        current = new URL(location, url);
        continue;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error("fetch_failed");
      }

      const $ = load(response.body);
      const title = $("title").first().text().trim();
      const description =
        $("meta[name=description]").attr("content")?.trim() ||
        $("meta[property='og:description']").attr("content")?.trim() ||
        "";

      return { title, description };
    }

    throw new Error("redirect_failed");
  } finally {
    clearTimeout(timeout);
  }
};
