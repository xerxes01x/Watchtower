import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./landing.css";

export const metadata: Metadata = {
  title: "Watchtower — Synthetic monitoring for distributed APIs",
  description:
    "A distributed monitoring engine for HTTP, gRPC, and webhook endpoints. Real-time SLA tracking, flap protection, and Prometheus-native metrics.",
};

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <div className="landing-root">{children}</div>;
}
