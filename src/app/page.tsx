import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "Wediff — личная операционная система",
  description: "Финансы, задачи, привычки, цели — всё под контролем.",
};

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return <LandingClient />;
}
