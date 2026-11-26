export function formatTimeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1h ago" : `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatChatTime(iso: string) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const thenDate = new Date(then);
  const now = new Date();
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round(
    (startOfDay(now) - startOfDay(thenDate)) / 86400000
  );
  if (days <= 0) {
    return thenDate.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) {
    return thenDate.toLocaleDateString("en-IN", { weekday: "short" });
  }
  return thenDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function formatDistance(km: number, unit: "Kilometers" | "Miles") {
  if (unit === "Miles") {
    return `${Math.max(1, Math.round(km * 0.621))} mi away`;
  }
  return `${Math.max(1, km)} km away`;
}

export function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function isValidAge(day: string, month: string, year: string) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) {
    return false;
  }
  if (d < 1 || d > 31 || m < 1 || m > 12) return false;
  const currentYear = new Date().getFullYear();
  if (y < currentYear - 99 || y > currentYear - 18) return false;
  const birth = new Date(y, m - 1, d);
  if (
    birth.getDate() !== d ||
    birth.getMonth() !== m - 1 ||
    birth.getFullYear() !== y
  ) {
    return false;
  }
  const age = ageFromDate(y, m, d);
  return age >= 18 && age <= 99;
}

export function ageFromDate(year: number, month: number, day: number) {
  const now = new Date();
  let age = now.getFullYear() - year;
  const hadBirthday =
    now.getMonth() + 1 > month ||
    (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!hadBirthday) age -= 1;
  return age;
}
