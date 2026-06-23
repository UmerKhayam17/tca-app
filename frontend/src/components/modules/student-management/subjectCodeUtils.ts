/** Grade suffix from names like "class 9th", "10th", "Grade 11" → "09", "10", "11". */
export function extractClassGradeSuffix(className: string): string {
  const text = className.trim();
  if (!text) return "";

  const match =
    text.match(/\b(\d{1,2})\s*(?:st|nd|rd|th)\b/i) ||
    text.match(/\b(?:class|grade|year|std|standard)\s*[-.]?\s*(\d{1,2})\b/i) ||
    text.match(/\b(\d{1,2})\b/);

  if (!match) return "";

  const n = parseInt(match[1], 10);
  if (Number.isNaN(n) || n < 1 || n > 99) return "";

  return n < 10 ? `0${n}` : String(n);
}

function subjectPrefix(subjectName: string): string {
  const cleaned = subjectName.trim();
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (words.length === 0) return "";

  if (words.length > 1) {
    const initials = words
      .map((w) => w.replace(/[^a-zA-Z]/g, "")[0])
      .filter(Boolean)
      .join("");
    if (initials.length >= 2) return initials.toUpperCase().slice(0, 6);
  }

  const word = words[0].replace(/[^a-zA-Z]/g, "");
  if (!word) return "";
  return word.length <= 4 ? word.toUpperCase() : word.slice(0, 4).toUpperCase();
}

/** e.g. Mathematics + "class 9th" → "MATH-09" */
export function generateSubjectCode(subjectName: string, className: string): string {
  const prefix = subjectPrefix(subjectName);
  const grade = extractClassGradeSuffix(className);
  if (!prefix) return grade;
  if (!grade) return prefix;
  return `${prefix}-${grade}`;
}

export function subjectCodePlaceholder(className: string): string {
  const grade = extractClassGradeSuffix(className);
  return grade ? `e.g. MATH-${grade}` : "e.g. MATH-09";
}
