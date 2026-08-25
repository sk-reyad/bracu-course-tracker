function decodePayload(token) {
  if (!token || typeof token !== "string") return {};
  try {
    const segment = token.split(".")[1];
    if (!segment) return {};
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {};
  }
}

export function jwtAssuranceLevel(token) {
  return decodePayload(token).aal === "aal2" ? "aal2" : "aal1";
}
