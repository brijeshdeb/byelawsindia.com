"use client";

/**
 * PlatformSidebarNav -- active-state nav for the Platform Admin shell.
 *
 * Client component: needs usePathname() to mark the current route.
 * Does not touch society context or permissions -- platform admin has
 * system-wide access that is verified server-side in the layout.
 *
 * Icons: Material Symbols Outlined (same family as the tenant shell).
 * Active state: 4px emerald left border per Stitch Obsidian design.
 */
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
  disabled?: boolean;
}

const platformNav: NavItem[] = [
  {
    label: "System Overview",
    href: "/platform/console",
    icon: "dashboard",
    exact: true,
  },
  {
    label: "Societies",
    href: "/platform/societies",
    icon: "domain",
    disabled: true,
  },
  {
    label: "User Management",
    href: "/platform/members",
    icon: "group",
  },
  {
    label: "Vendors",
    href: "/platform/vendors",
    icon: "storefront",
    disabled: true,
  },
  {
    label: "Contracts",
    href: "/platform/contracts",
    icon: "assignment",
    disabled: true,
  },
];

const platformFooterNav: NavItem[] = [
  {
    label: "Settings",
    href: "/platform/settings",
    icon: "settings",
    disabled: true,
  },
  {
    label: "Support",
    href: "/platform/support",
    icon: "help",
    disabled: true,
  },
];

export function PlatformSidebarNav() {
  const pathname = usePathname();

  function NavLink({ item }: { item: NavItem }) {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    if (item.disabled) {
      return (
        <span
          className="sidebar-nav-item"
          style={{ opacity: 0.4, cursor: "not-allowed" }}
          title="Coming soon"
          aria-disabled="true"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "20px" }}
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <span>{item.label}</span>
        </span>
      );
    }

    return (
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
    );
  }

  return (
    <nav aria-label="Platform navigation">
      <div className="mb-1">
        <p className="sidebar-nav-group-label">Platform</p>
        <ul role="list">
          {platformNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-1" style={{ marginTop: "auto" }}>
        <p className="sidebar-nav-group-label">System</p>
        <ul role="list">
          {platformFooterNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
