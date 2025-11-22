"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { HomeWelcome } from "@/components/homeWelcome";
import { RoleSelector } from "@/components/roleSelector";
import { useRouter, useParams } from "next/navigation";

export default function MarketplacePage() {
  const userRole = useUserStore((state) => state.role);
  const vendorProfile = useUserStore((state) => state.vendorProfile);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (userRole === "vendor" && !vendorProfile) {
      router.push(`/${locale}/vendor-registration`);
    }
  }, [userRole, vendorProfile, router, locale]);

  if (userRole === "none") {
    return <RoleSelector />;
  }

  if (userRole === "vendor" && !vendorProfile) {
    return null; 
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
