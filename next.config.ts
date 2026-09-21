import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next refuses to serve dev assets to an origin it does not recognise, which
  // silently leaves the page rendered but unhydrated. Anything other than
  // `localhost` needs listing here — an IP, a LAN address, or a tunnel host.
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "*.local", "*.ngrok-free.app", "*.trycloudflare.com"],
  // The workspace writes Markdown into vault/ at runtime; without this the
  // production server traces the wrong root when the repo sits inside a monorepo.
  outputFileTracingRoot: process.cwd(),
  // The floating dev badge sits on top of the sidebar footer.
  devIndicators: false,
};

export default nextConfig;
