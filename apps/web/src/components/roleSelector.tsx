"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useCallback } from "react";
import { ShoppingCart, Store, Heart } from "lucide-react";

interface RoleOption {
  id: "vendor" | "donor" | "beneficiary";
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
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
      icon: <Store className="w-12 h-12" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
    },
    {
      id: "donor",
      titleKey: "roles.donor.title",
      descriptionKey: "roles.donor.description",
      icon: <Heart className="w-12 h-12" />,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
    },
    {
      id: "beneficiary",
      titleKey: "roles.beneficiary.title",
      descriptionKey: "roles.beneficiary.description",
      icon: <ShoppingCart className="w-12 h-12" />,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("roles.selectRole")}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t("roles.selectRoleDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`p-8 rounded-lg border-2 border-gray-200 transition-all duration-300 text-left cursor-pointer group ${role.bgColor}`}
              aria-label={`Select ${t(role.titleKey)} role`}
            >
              <div className={`mb-4 ${role.color}`}>{role.icon}</div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                {t(role.titleKey)}
              </h2>
              <p className="text-gray-600 group-hover:text-gray-700">
                {t(role.descriptionKey)}
              </p>

              <div className="mt-6 inline-block">
                <span className="text-lg font-semibold text-gray-400 group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500">
          {t("roles.canChangeRole")}
        </p>
      </div>
    </div>
  );
}
