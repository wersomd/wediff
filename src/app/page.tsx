import type { Metadata } from "next";
import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "Wediff — личная операционная система",
  description: "Финансы, задачи, привычки, цели — всё под контролем.",
};

// Root is always the public landing. The "Войти" CTA links to /dashboard;
// middleware sends logged-in visitors straight in and others to /login.
export default function Home() {
  return <LandingClient />;
}
