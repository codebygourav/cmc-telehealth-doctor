export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanAndDeduplicateText(text?: string | null): string {
  if (!text) return "";

  let cleaned = text.trim();
  // Remove outer quotes if wrapped
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Replace literal '\n' characters with real newlines
  cleaned = cleaned.replace(/\\n/g, "\n");

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueLines: string[] = [];

  for (const line of lines) {
    let normalized = line.replace(/^["'\-•\s]+|["'\-•\s]+$/g, "").trim();
    if (!normalized) continue;

    const lower = normalized.toLowerCase();
    if (
      lower.startsWith("diagnosis:") ||
      lower.startsWith("order investigation:") ||
      lower.startsWith("recommended tests:") ||
      lower.startsWith("clinical findings:")
    ) {
      continue;
    }

    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueLines.push(normalized);
    }
  }

  return uniqueLines.join("\n");
}

export function sanitizeClinicalText(text?: string | null): string {
  if (!text) return "";
  let cleaned = text.replace(/\s+/g, " ").trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/\\n/g, "\n").trim();
}

export function parseClinicalInstructions(rawText?: string | null): {
  diagnosis: string;
  orderInvestigation: string;
  notes: string;
  instructionsByDoctor: string;
} {
  const result = {
    diagnosis: "",
    orderInvestigation: "",
    notes: "",
    instructionsByDoctor: "",
  };

  if (!rawText || rawText === "Consultation conclusion submitted.") {
    return result;
  }

  const sectionRegex = /(Diagnosis|Order Investigation|Notes|Instructions by Doctor|Recommended Tests|Clinical Findings):\s*/gi;
  const matches = Array.from(rawText.matchAll(sectionRegex));

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const header = match[1].toLowerCase();
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : rawText.length;
      const value = rawText.slice(startIndex, endIndex).trim();

      if (header === "diagnosis") result.diagnosis = value;
      else if (header === "order investigation") result.orderInvestigation = value;
      else if (header === "notes") result.notes = value;
      else if (header === "instructions by doctor") result.instructionsByDoctor = value;
    }

    const firstMatchIndex = matches[0].index!;
    if (firstMatchIndex > 0) {
      const textBefore = rawText.slice(0, firstMatchIndex).trim();
      if (textBefore && !result.instructionsByDoctor) {
        result.instructionsByDoctor = textBefore;
      }
    }
  } else {
    result.instructionsByDoctor = rawText.trim();
  }

  return result;
}
