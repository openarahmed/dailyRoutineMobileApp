// utils/timeHelpers.ts

/**
 * Converts a Date object to a formatted time string like "5:30 PM".
 * @param date The Date object to format. Can be null.
 * @returns A formatted time string or "Not Set" if date is null.
 */
export const formatTime = (date: Date | null): string => {
  if (!date) return "Not Set";
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12; // Converts 0 or 12 to 12
  return `${hours}:${m} ${ampm}`;
};

/**
 * Converts a time string like "5:30 PM" to a Date object for today or tomorrow.
 * If the resulting time is in the past for today, it returns the date for tomorrow.
 * @param timeStr The time string to convert.
 * @returns A Date object.
 */
export const timeStringToDate = (timeStr: string): Date => {
  const now = new Date();
  if (typeof timeStr !== "string" || !timeStr.trim()) {
    console.warn("timeStringToDate received invalid time string:", timeStr);
    return now;
  }

  const parts = timeStr.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
  if (!parts) {
    console.warn("timeStringToDate could not parse time string:", timeStr);
    return now;
  }

  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const modifier = parts[3].toUpperCase();

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0; // Midnight case
  }

  const result = new Date();
  result.setHours(hours, minutes, 0, 0);

  // If the calculated time is earlier than the current time, set it for the next day.
  if (result.getTime() < now.getTime()) {
    result.setDate(result.getDate() + 1);
  }

  return result;
};

/**
 * Converts a time string like "5:30 PM" to total minutes from midnight (e.g., 1050).
 * @param timeStr The time string to convert.
 * @returns Total minutes from midnight.
 */
export const timeToMinutes = (timeStr: string | undefined | null): number => {
  if (typeof timeStr !== "string" || !timeStr.trim()) {
    return 0;
  }

  const parts = timeStr.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
  if (!parts) return 0;

  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const modifier = parts[3].toUpperCase();

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }
  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + (minutes || 0);
};

/**
 * Formats a duration in milliseconds into a human-readable countdown string like "1h 30m 5s".
 * @param ms The duration in milliseconds.
 * @returns A formatted countdown string.
 */
export const formatCountdown = (ms: number): string => {
  if (ms <= 0) return "starting now";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}s`);

  return parts.join(" ");
};
