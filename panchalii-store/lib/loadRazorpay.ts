"use client";

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let pending: Promise<boolean> | null = null;

/** Loads Razorpay's checkout.js once. Resolves false if it can't load. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      pending = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return pending;
}
