"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useCallback } from "react";

interface RoleOption {
  id: "vendor" | "donor" | "beneficiary";
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

export function RoleSelector() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const setRole = useUserStore((state) => state.setRole);

  const roles: RoleOption[] = [
    {
      id: "vendor",
      titleKey: "roles.vendor.title",
      descriptionKey: "roles.vendor.description",
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 7H4M20 7v10c0 1-1 2-2 2H6c-1 0-2-1-2-2V7M9 7V5c0-1 1-2 2-2h2c1 0 2 1 2 2v2M6 17v2h12v-2" />
          <path d="M10 11v3M14 11v3M8 14h8" />
        </svg>
      ),
    },
    {
      id: "donor",
      titleKey: "roles.donor.title",
      descriptionKey: "roles.donor.description",
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      id: "beneficiary",
      titleKey: "roles.beneficiary.title",
      descriptionKey: "roles.beneficiary.description",
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },
  ];

  const handleRoleSelect = useCallback(
    (roleId: "vendor" | "donor" | "beneficiary") => {
      setRole(roleId);

      router.push(`/${locale}`);
    },
    [setRole, router, locale]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mt-6 mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {t("roles.selectRole")}
          </h1>
          <p className="text-gray-600 text-lg">
            {t("roles.selectRoleDescription")}
          </p>
        </div>

        <div className="space-y-6">
          {roles.map((role) => {
            const colorClass =
              role.id === "vendor"
                ? "text-blue-500"
                : role.id === "donor"
                ? "text-red-500"
                : "text-green-500";

            return (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`w-full p-8 rounded-3xl border-3 transition-all duration-300 cursor-pointer group hover:shadow-lg flex flex-col items-center text-center ${
                  role.id === "vendor"
                    ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                    : role.id === "donor"
                    ? "border-red-400 bg-red-50 hover:bg-red-100"
                    : "border-green-400 bg-green-50 hover:bg-green-100"
                }`}
                aria-label={`Select ${t(role.titleKey)} role`}
              >
                <div className={`mb-2 ${colorClass}`}>{role.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {t(role.titleKey)}
                </h2>
                <p className="text-gray-600 text-lg mb-2">
                  {t(role.descriptionKey)}
                </p>

                <div>
                  <span className="text-2xl text-gray-400 group-hover:text-gray-600 transition-colors">
                    →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-500 mt-8">
          {t("roles.canChangeRole")}
        </p>
      </div>
    </div>
  );
}
