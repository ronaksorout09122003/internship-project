import { format, formatDistanceToNowStrict } from "date-fns";

export function formatTimestamp(value: string) {
  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

export function formatRelativeTime(value: string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function formatSessionDate(value: string | null | undefined) {
  if (!value) {
    return "Flexible schedule";
  }

  return format(new Date(value), "dd MMM yyyy, hh:mm a");
}

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) {
    return "Flexible length";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`;
}

export function formatDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
