/** Pakistani CNIC, mobile, and landline formatting + validation. */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** CNIC: XXXXX-XXXXXXX-X (13 digits) */
export function formatCnicInput(value: string): string {
  const d = digitsOnly(value).slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export function isValidCnic(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 13;
}

export function cnicValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidCnic(trimmed)) return null;
  const len = digitsOnly(trimmed).length;
  if (len < 13) return "CNIC must be 13 digits (XXXXX-XXXXXXX-X)";
  return "Enter a valid 13-digit CNIC";
}

/** Mobile: 03XX-XXXXXXX (11 digits) */
export function formatMobileInput(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 4) return d;
  return `${d.slice(0, 4)}-${d.slice(4)}`;
}

export function isValidMobile(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 11 && /^03\d{9}$/.test(d);
}

export function mobileValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Mobile number is required";
  if (isValidMobile(trimmed)) return null;
  const d = digitsOnly(trimmed);
  if (!d.startsWith("03")) return "Mobile number must start with 03";
  if (d.length < 11) return "Mobile number must be 11 digits (03XX-XXXXXXX)";
  return "Enter a valid mobile number (03XX-XXXXXXX)";
}

/** Landline: 0XX-XXXXXXX (10 digits) */
export function formatLandlineInput(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

export function isValidLandline(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 10 && /^0[1-9]\d{8}$/.test(d);
}

export function landlineValidationMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isValidLandline(trimmed)) return null;
  const d = digitsOnly(trimmed);
  if (!d.startsWith("0")) return "Contact number must start with 0";
  if (d.length < 10) return "Contact number must be 10 digits (0XX-XXXXXXX)";
  return "Enter a valid contact number (0XX-XXXXXXX)";
}
