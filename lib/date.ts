const TIME_ZONE = "Asia/Kolkata";

function partMap(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export function dayInIndia(date = new Date()) {
  const parts = partMap(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function monthInIndia(date = new Date()) {
  const parts = partMap(date);
  return `${parts.year}-${parts.month}`;
}

export function displayInIndia(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function lastNDaysInIndia(count: number) {
  const days: string[] = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - index);
    days.push(dayInIndia(date));
  }
  return days;
}
