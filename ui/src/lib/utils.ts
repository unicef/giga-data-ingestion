import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateString(string: string, toWords: number) {
  const split = string.split(" ");

  return split.length > toWords ? `${split.slice(0, toWords).join(" ")}...` : string;
}

export function convertMegabytesToBytes(mb: number) {
  return mb * (2 ** 10) ** 2;
}

export function convertBytesToMegabytes(b: number) {
  return b / (2 ** 10) ** 2;
}
