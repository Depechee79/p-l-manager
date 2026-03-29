import { Timestamp } from 'firebase/firestore';

/**
 * Type guard for serialized Timestamp objects ({seconds, nanoseconds}).
 * When a Firestore Timestamp is JSON.stringify'd and parsed back,
 * it becomes a plain object with seconds/nanoseconds fields but loses
 * the Timestamp prototype, so instanceof Timestamp returns false.
 */
interface SerializedTimestamp {
  seconds: number;
  nanoseconds: number;
}

function isSerializedTimestamp(value: unknown): value is SerializedTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof (value as SerializedTimestamp).seconds === 'number' &&
    typeof (value as SerializedTimestamp).nanoseconds === 'number'
  );
}

/**
 * Extract date-only string (YYYY-MM-DD) from various date formats.
 * Handles: Firestore Timestamp, serialized Timestamp, ISO string, Date object.
 */
export function formatDateOnly(value: Timestamp | string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Timestamp) return value.toDate().toISOString().split('T')[0];
  if (isSerializedTimestamp(value)) return new Date(value.seconds * 1000).toISOString().split('T')[0];
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string' && value.includes('T')) return value.split('T')[0];
  return value as string;
}

/**
 * Convert various date formats to a Date object.
 */
export function toDate(value: Timestamp | string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (isSerializedTimestamp(value)) return new Date(value.seconds * 1000);
  if (value instanceof Date) return value;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convert various date formats to ISO string.
 */
export function toISOString(value: Timestamp | string | Date | null | undefined): string {
  if (!value) return '';
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (isSerializedTimestamp(value)) return new Date(value.seconds * 1000).toISOString();
  if (value instanceof Date) return value.toISOString();
  return value as string;
}
