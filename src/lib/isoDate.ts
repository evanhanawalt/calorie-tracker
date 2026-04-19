import { isoDateStringSchema } from "@/lib/trackerWire";

export function isIsoDateString(value: string): boolean {
  return isoDateStringSchema.safeParse(value).success;
}
