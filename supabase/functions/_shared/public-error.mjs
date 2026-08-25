export function publicErrorMessage(error, allowedMessages = new Set(), fallback = 'Request failed.') {
  const message = error instanceof Error ? error.message : '';
  return allowedMessages.has(message) ? message : fallback;
}
