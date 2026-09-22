import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next refuses to serve dev assets to an origin it does not recognise: the
  // HTML still returns 200 but every /_next/static request 403s, so the page
  // arrives with no styles and no JavaScript and looks simply broken. Only
  // `localhost` is trusted by default, which breaks plain `127.0.0.1`, a LAN
  // address, and any proxied preview or tunnel host.
  // A bare "*" is ignored, so unknown proxy hosts have to be added by name.
  // When that is not practical, `npm run preview` serves a production build,
  // which has no origin restriction.
  allowedDevOrigins: [
    "127.0.0.1",
    "0.0.0.0",
    "*.local",
    "*.cursor.com",
    "*.cursor.sh",
    "*.ngrok-free.app",
    "*.trycloudflare.com",
  ],
  // The workspace writes Markdown into vault/ at runtime; without this the
  // production server traces the wrong root when the repo sits inside a monorepo.
  outputFileTracingRoot: process.cwd(),
  // The floating dev badge sits on top of the sidebar footer.
  devIndicators: false,
};

export default nextConfig;
