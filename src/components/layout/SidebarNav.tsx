"use client";

/**
 * SidebarNav — permission-gated navigation tree.
 *
 * Client component: reads the current URL to mark active items.
 * Permission data comes from the server via props so we never
 * compute authorization in a client component.
 *
 * Icons: Material Symbols Outlined (string names, loaded via Google Fonts).
 * Active state: 4px emerald left border per Stitch Obsidian design.
 */
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserContext, PermissionCode } from "@/types";
import { PERMISSIONS } from "@/types";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";

interface NavItem {
  label: string;
  href: string;
  /** Material Symbols Outlined icon name */
  icon: string;
  /** If provided, the item is hidden unless user holds this permission. */
  permission?: PermissionCode;
  /** If provided, the item is shown if user holds ANY of these. */
  anyOf?: PermissionCode[];
  /** Match exact path (default false — prefix match). */
  exact?: boolean;
  /** If true, the item is ONLY shown to platform admins. */
  platformAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function buildNavGroups(): NavGroup[] {
  return [
    {
      label: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: "dashboard",
          exact: true,
        },
      ],
    },
    {
      label: "Registry",
      items: [
        {
          label: "Members",
          href: "/members",
          icon: "group",
          exact: true,
          anyOf: [
            PERMISSIONS.MEMBER_VIEW,
            PERMISSIONS.MEMBER_CREATE,
            PERMISSIONS.MEMBER_UPDATE,
          ],
        },
        {
          label: "Units",
          href: "/units",
          icon: "apartment",
          permission: PERMISSIONS.MEMBER_VIEW,
        },
        {
          label: "Form I & Form J",
          href: "/members/statutory-registers",
          icon: "table_view",
          permission: PERMISSIONS.MEMBER_VIEW,
        },
      ],
    },
    {
      label: "Applications",
      items: [
        {
          label: "All Applications",
          href: "/applications",
          icon: "description",
          anyOf: [
            PERMISSIONS.APPLICATION_VIEW,
            PERMISSIONS.APPLICATION_CREATE,
            PERMISSIONS.APPLICATION_APPROVE_LEVEL1,
            PERMISSIONS.APPLICATION_APPROVE_LEVEL2,
            PERMISSIONS.APPLICATION_APPROVE_FINAL,
          ],
        },
      ],
    },
    {
      label: "Maintenance",
      items: [
        {
          label: "Complaints",
          href: "/maintenance/complaints",
          icon: "build",
          permission: PERMISSIONS.MAINTENANCE_VIEW,
        },
        {
          label: "Work Orders",
          href: "/maintenance/work-orders",
          icon: "handyman",
          permission: PERMISSIONS.MAINTENANCE_MANAGE,
        },
      ],
    },
    {
      label: "Documents",
      items: [
        {
          label: "Repository",
          href: "/documents",
          icon: "folder_open",
          anyOf: [
            PERMISSIONS.DOCUMENT_VIEW,
            PERMISSIONS.DOCUMENT_UPLOAD,
            PERMISSIONS.DOCUMENT_VERIFY,
          ],
        },
      ],
    },
    {
      label: "Vendors",
      items: [
        {
          label: "Vendor Registry",
          href: "/vendors",
          icon: "storefront",
          anyOf: [
            PERMISSIONS.VENDOR_VIEW,
            PERMISSIONS.VENDOR_MANAGE,
            PERMISSIONS.VENDOR_VERIFY,
          ],
        },
      ],
    },
    {
      label: "Procurement",
      items: [
        {
          label: "RFQs",
          href: "/procurement/rfqs",
          icon: "shopping_cart",
          anyOf: [
            PERMISSIONS.RFQ_CREATE,
            PERMISSIONS.RFQ_VIEW,
            PERMISSIONS.RFQ_EVALUATE,
            PERMISSIONS.RFQ_APPROVE,
          ],
        },
        {
          label: "Work Orders",
          href: "/procurement/work-orders",
          icon: "assignment",
          anyOf: [PERMISSIONS.RFQ_APPROVE, PERMISSIONS.RFQ_EVALUATE],
        },
        {
          label: "Contracts",
          href: "/procurement/contracts",
          icon: "contract",
          anyOf: [
            PERMISSIONS.CONTRACT_VIEW,
            PERMISSIONS.CONTRACT_CREATE,
            PERMISSIONS.CONTRACT_APPROVE,
          ],
        },
      ],
    },
    {
      label: "Finance",
      items: [
        {
          label: "Maintenance Dues",
          href: "/finance/dues",
          icon: "credit_card",
          permission: PERMISSIONS.FINANCE_VIEW,
        },
        {
          label: "Payments",
          href: "/finance/payments",
          icon: "payments",
          permission: PERMISSIONS.FINANCE_MANAGE,
        },
      ],
    },
    {
      label: "Reports",
      items: [
        {
          label: "Reports",
          href: "/reports",
          icon: "bar_chart",
          permission: PERMISSIONS.REPORT_VIEW,
        },
        {
          label: "Audit Log",
          href: "/reports/audit",
          icon: "history",
          permission: PERMISSIONS.AUDIT_LOG_VIEW,
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          label: "Society Settings",
          href: "/admin/settings",
          icon: "settings",
          permission: PERMISSIONS.SOCIETY_SETTINGS_MANAGE,
        },
        {
          label: "Users & Roles",
          href: "/admin/users",
          icon: "manage_accounts",
          anyOf: [
            PERMISSIONS.USER_MANAGE,
            PERMISSIONS.ROLE_MANAGE,
          ],
        },
        {
          label: "Wings & Units",
          href: "/admin/wings",
          icon: "domain",
          permission: PERMISSIONS.SOCIETY_SETTINGS_MANAGE,
        },
      ],
    },
    {
      label: "Platform",
      items: [
        {
          label: "Platform Console",
          href: "/platform/console",
          icon: "admin_panel_settings",
          platformAdminOnly: true,
        },
      ],
    },
  ];
}

interface Props {
  context: UserContext;
}

export function SidebarNav({ context }: Props) {
  const pathname = usePathname();
  const groups = buildNavGroups();

  return (
    <nav aria-label="Main navigation">
      {groups.map((group) => {
        const visibleItems = group.items.filter((item) => {
          // Items reserved for platform admins are hidden from regular users.
          if (item.platformAdminOnly) return context.isPlatformAdmin === true;
          // Platform admins can see everything else too.
          if (context.isPlatformAdmin) return true;
          if (item.permission) return hasPermission(context, item.permission);
          if (item.anyOf) return hasAnyPermission(context, item.anyOf);
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.label} className="mb-1">
            <p className="sidebar-nav-group-label">{group.label}</p>
            <ul role="list">
              {visibleItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn("sidebar-nav-item", isActive && "active")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                        aria-hidden="true"
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
