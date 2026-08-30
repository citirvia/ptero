"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ServerIndexRedirect() {
  const router = useRouter();
  const params = useParams<{ serverId: string }>();
  useEffect(() => {
    router.replace(`/dashboard/servers/${params.serverId}/overview`);
  }, [router, params.serverId]);
  return null;
}
