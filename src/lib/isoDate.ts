const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateString(value: string): boolean {
  return ISO_DATE.test(value);
}
