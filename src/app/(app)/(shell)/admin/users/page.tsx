import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

export default function UsersPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            User Management
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Registered users and their access assignments
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium cursor-not-allowed"
          style={{ backgroundColor: "#1c1b1b", color: "#6B7280", border: "1px solid #333333" }}
          title="Coming in the next release"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
          Invite User
        </button>
      </div>

      <div className="queue-section">
        <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
          <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>manage_accounts</span>
          <p className="text-sm font-medium mb-1" style={{ color: "#9CA3AF" }}>
            User provisioning arrives in the next release
          </p>
          <p className="text-xs text-center max-w-sm">
            Once live, you will be able to invite committee members and assign roles by wing or society-wide scope.
          </p>
        </div>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Live user provisioning with email invites arrives in the next release.
          </p>
        </div>
      </div>
    </div>
  );
}
