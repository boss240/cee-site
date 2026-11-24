import { siteOrigin, isPreviewDeployment } from "@/lib/siteUrl";
import type { MetadataRoute } from "next";

const base = siteOrigin();

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/uk/admin", "/en/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
