"use client";

import { useState, } from "react";
import { useUserStore } from "@/stores/userStore";
import { HomeWelcome } from "@/components/homeWelcome";
import { RoleSelector } from "@/components/roleSelector";

export default function MarketplacePage() {
  const userRole = useUserStore((state) => state.role);

  const [searchQuery, setSearchQuery] = useState("");

  if (userRole === "none") {
    return <RoleSelector />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <HomeWelcome
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

    </div>
  );
}
