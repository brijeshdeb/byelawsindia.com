import type { Metadata } from "next";

export const metadata: Metadata = { title: "Society Settings" };

const SECTIONS = [
  {
    title: "Society Profile",
    icon: "business",
    fields: [
      { label: "Society Name", value: "Willow Heights CHS", editable: true },
      { label: "Registration Number", value: "MH/MUM/HSG/TC/12345/2015", editable: false },
      { label: "Registered Address", value: "Plot 47, Andheri West, Mumbai 400053", editable: true },
      { label: "Incorporation Date", value: "14 March 2015", editable: false },
      { label: "Financial Year", value: "April to March", editable: false },
    ],
  },
  {
    title: "Maintenance & Billing",
    icon: "receipt_long",
    fields: [
      { label: "Standard Monthly Charge", value: "₹4,200 per unit", editable: true },
      { label: "Due Date (Day of Month)", value: "10th", editable: true },
      { label: "Late Payment Penalty", value: "2% per month after due date", editable: true },
      { label: "Interest Waiver Period", value: "5 days grace period", editable: true },
    ],
  },
  {
    title: "Notifications",
    icon: "notifications",
    fields: [
      { label: "Dues Reminder (Days Before)", value: "3 days before due date", editable: true },
      { label: "Overdue Alert Frequency", value: "Every 7 days", editable: true },
      { label: "Complaint SLA Alert", value: "Escalate if open > 72 hours", editable: true },
    ],
  },
  {
    title: "Approval Workflow",
    icon: "approval",
    fields: [
      { label: "NOC Approval Levels", value: "Secretary + Chairman", editable: true },
      { label: "RFQ Approval Threshold", value: "Chairman sign-off above ₹50,000", editable: true },
      { label: "Expenditure Auth Limit", value: "Secretary up to ₹25,000; Chairman up to ₹1,00,000", editable: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Society Settings
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Configuration and policy settings for this society
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
          Save Changes
        </button>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>{section.icon}</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">{section.title}</h2>
            </div>

            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {section.fields.map((field) => (
                <div key={field.label} className="px-5 py-3 flex items-center justify-between">
                  <p className="font-label-md text-label-md" style={{ color: "#9CA3AF", minWidth: "260px" }}>{field.label}</p>
                  <div className="flex items-center gap-3 flex-1">
                    <p className="font-body-sm text-body-sm text-text-primary">{field.value}</p>
                    {field.editable && (
                      <button title="Edit" className="material-symbols-outlined" style={{ fontSize: "16px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", marginLeft: "8px" }}>
                        edit
                      </button>
                    )}
                    {!field.editable && (
                      <span className="font-label-md text-label-md px-2 py-0.5 rounded ml-2" style={{ backgroundColor: "rgba(107,114,128,0.1)", color: "#6B7280", fontSize: "10px" }}>
                        read-only
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
          Phase 0: settings are read-only display. Live configuration with change audit arrives in Phase 2.
        </p>
      </div>
    </div>
  );
}
