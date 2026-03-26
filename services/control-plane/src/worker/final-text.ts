import type { JsonValue } from "../types.js";

export function parseJsonOutput(stdout: string): JsonValue | null {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    // fall through
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]!) as JsonValue;
    } catch {
      // keep looking
    }
  }

  return null;
}

export function extractFinalText(payload: JsonValue | null): string | null {
  if (payload === null) {
    return null;
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (typeof payload === "number" || typeof payload === "boolean") {
    return String(payload);
  }
  if (Array.isArray(payload)) {
    for (let index = payload.length - 1; index >= 0; index -= 1) {
      const result = extractFinalText(payload[index] ?? null);
      if (result) {
        return result;
      }
    }
    return null;
  }

  const record = payload as Record<string, JsonValue>;
  const preferredKeys = [
    "final",
    "finalText",
    "result",
    "output",
    "assistant",
    "text",
    "content",
    "message"
  ];
  for (const key of preferredKeys) {
    if (key in record) {
      const result = extractFinalText(record[key] ?? null);
      if (result) {
        return result;
      }
    }
  }

  for (const value of Object.values(record)) {
    const result = extractFinalText(value);
    if (result) {
      return result;
    }
  }

  return null;
}
