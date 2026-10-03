// Escape user input before putting it in a RegExp (search boxes)
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parsePaging = (query: any, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(String(query.page), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

// Turn rows into CSV text. Cells that start with = + - @ are prefixed with ' so
// spreadsheet apps don't run them as formulas (CSV injection).
export const toCsv = (headers: string[], rows: Array<Array<unknown>>) => {
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return "";
    let s = v instanceof Date ? v.toISOString() : String(v);
    if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
};
