import ExcelJS from "exceljs";
import { writeFile } from "node:fs/promises";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let buildStatutoryRegister: typeof import("@/lib/statutory-registers").buildStatutoryRegister;

beforeAll(async () => {
  ({ buildStatutoryRegister } = await import("@/lib/statutory-registers"));
});

const sampleRows = [{
  memberNumber: "MBR-001",
  flatNumber: "A-101",
  fullName: "Asha Rao",
  address: "Pune, Maharashtra",
  occupation: "Architect",
  ageAtAdmission: 42,
  admissionDate: "2024-01-15",
  entranceFeePaidAt: "2024-01-15",
  nomineeNameAddress: "Rahul Rao, Pune",
  nominationDate: "2024-02-01",
  cessationDate: "",
  cessationReason: "",
  remark: "",
  memberClass: "Owner",
  status: "Active",
}];

describe("statutory register workbooks", () => {
  it("creates Form I with every supplied statutory column", async () => {
    const bytes = await buildStatutoryRegister({
      formType: "FORM_I",
      societyName: "Test CHS",
      registrationNumber: "REG-001",
      rows: sampleRows,
    });
    const workbook = new ExcelJS.Workbook();
    if (process.env.STATUTORY_PREVIEW_DIR) {
      await writeFile(`${process.env.STATUTORY_PREVIEW_DIR}/form-i-preview.xlsx`, bytes);
    }
    await workbook.xlsx.load(Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const sheet = workbook.getWorksheet("Form I")!;

    expect(sheet.getRow(2).values).toEqual([
      undefined,
      "Sr.No",
      "Flat No",
      "Date of Admission",
      "Date of Payment of Entrance Fees",
      "Full Name",
      "Address",
      "Occupation",
      "Age on the date of Admission",
      "Full Name & Address of the person nominated by member",
      "Date of Nomination",
      "Date of cessation of membership",
      "Reason of cessation",
      "Remark",
    ]);
    expect(sheet.getCell("E3").value).toBe("Asha Rao");
    expect(sheet.getCell("I3").value).toBe("Rahul Rao, Pune");
  });

  it("creates Form J with the supplied six-column layout", async () => {
    const bytes = await buildStatutoryRegister({
      formType: "FORM_J",
      societyName: "Test CHS",
      registrationNumber: "REG-001",
      rows: sampleRows,
    });
    const workbook = new ExcelJS.Workbook();
    if (process.env.STATUTORY_PREVIEW_DIR) {
      await writeFile(`${process.env.STATUTORY_PREVIEW_DIR}/form-j-preview.xlsx`, bytes);
    }
    await workbook.xlsx.load(Buffer.from(bytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const sheet = workbook.getWorksheet("Form J")!;

    expect(sheet.getRow(2).values).toEqual([
      undefined,
      "Sr.No",
      "Flat No.",
      "Full Name of Member",
      "Address",
      "Class of Member",
      "Status",
    ]);
    expect(sheet.getRow(3).values).toEqual([
      undefined,
      1,
      "A-101",
      "Asha Rao",
      "Pune, Maharashtra",
      "Owner",
      "Active",
    ]);
  });
});
