"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewServerButton() {
  return (
    <Button asChild size="sm">
      <Link href="/dashboard/servers/new">
        <Plus />
        New server
      </Link>
    </Button>
  );
}
