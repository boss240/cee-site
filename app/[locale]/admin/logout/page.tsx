"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useParams } from "next/navigation";

export default function AdminLogoutPage() {
  const params = useParams<{ locale: string }>();

  useEffect(() => {
    signOut({ callbackUrl: `/${params.locale}/admin/login` });
  }, [params.locale]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--color-fg-muted)]">
      …
    </div>
  );
}
