"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Mirrors the real OMS role model. In the demo this is a switcher so we can
// show how permission-gated actions (refunds, payouts, exports) behave per
// role. The real app backs this with Clerk + a permission guard.
export type AdminRole =
  | "super_admin"
  | "ops_admin"
  | "support_admin"
  | "finance_admin"
  | "read_only_admin";

export type Permission =
  | "view_orders"
  | "edit_order_notes"
  | "approve_returns"
  | "process_refunds"
  | "void_labels"
  | "retry_shopify_writeback"
  | "retry_label_generation"
  | "view_payouts"
  | "manage_payouts"
  | "export_orders";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "view_orders",
    "edit_order_notes",
    "approve_returns",
    "process_refunds",
    "void_labels",
    "retry_shopify_writeback",
    "retry_label_generation",
    "view_payouts",
    "manage_payouts",
    "export_orders",
  ],
  ops_admin: [
    "view_orders",
    "edit_order_notes",
    "approve_returns",
    "void_labels",
    "retry_shopify_writeback",
    "retry_label_generation",
    "export_orders",
  ],
  support_admin: ["view_orders", "edit_order_notes", "approve_returns"],
  finance_admin: [
    "view_orders",
    "process_refunds",
    "view_payouts",
    "manage_payouts",
    "export_orders",
  ],
  read_only_admin: ["view_orders", "view_payouts"],
};

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  ops_admin: "Ops admin",
  support_admin: "Support admin",
  finance_admin: "Finance admin",
  read_only_admin: "Read only",
};

const ROLE_KEY = "avnu-oms-role";

export function useAdminRole() {
  const [role, setRole] = useLocalStorage<AdminRole>(ROLE_KEY, "super_admin");

  const can = useCallback(
    (permission: Permission) => ROLE_PERMISSIONS[role].includes(permission),
    [role],
  );

  return { role, setRole, can };
}
