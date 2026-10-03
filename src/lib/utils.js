import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cssDurationCache = new Map();

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getCssDurationSeconds(tokenName) {
  if (cssDurationCache.has(tokenName)) return cssDurationCache.get(tokenName);
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  const duration = Number.parseFloat(value);
  const seconds = !Number.isFinite(duration) ? 0 : value.endsWith("ms") ? duration / 1000 : duration;
  cssDurationCache.set(tokenName, seconds);
  return seconds;
}
