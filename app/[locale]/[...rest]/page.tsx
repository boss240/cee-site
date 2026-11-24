import { notFound } from "next/navigation";

// Keep unknown localized paths inside the locale layout and its translated 404.
export default function UnknownLocalizedPage() {
  notFound();
}
