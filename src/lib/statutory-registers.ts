import ExcelJS from "exceljs";

export type RegisterFormType = "FORM_I" | "FORM_J";

export interface StatutoryMemberRow {
  memberNumber: string;
  flatNumber: string;
  fullName: string;
  address: string;
  occupation: string;
  ageAtAdmission: number | null;
  admissionDate: string;
  entranceFeePaidAt: string;
  nomineeNameAddress: string;
  nominationDate: string;
  cessationDate: string;
  cessationReason: string;
  remark: string;
  memberClass: string;
  status: string;
}

const HEADER_FILL = "9BBB59";
const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF000000" } },
  bottom: { style: "thin", color: { argb: "FF000000" } },
  right: { style: "thin", color: { argb: "FF000000" } },
};

function dateValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatSheet(sheet: ExcelJS.Worksheet, columnWidths: number[], pagesWide = 1) {
  sheet.views = [{ state: "frozen", ySplit: 2 }];
  sheet.properties.defaultRowHeight = 18;
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: pagesWide,
    fitToHeight: 0,
    margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
  };
  sheet.columns.forEach((column, index) => {
    column.width = columnWidths[index];
  });
  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER;
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber === 1 ? "center" : "left",
        wrapText: true,
      };
      cell.font = { name: rowNumber <= 2 ? "Cambria" : "Calibri", size: 11 };
    });
  });
}

function addTitleAndHeaders(sheet: ExcelJS.Worksheet, title: string, headers: string[], splitTitleAt?: number) {
  const titleStarts = splitTitleAt ? [1, splitTitleAt + 1] : [1];
  const titleEnds = splitTitleAt ? [splitTitleAt, headers.length] : [headers.length];
  titleStarts.forEach((start, index) => {
    const end = titleEnds[index] ?? headers.length;
    sheet.mergeCells(1, start, 1, end);
    const titleCell = sheet.getCell(1, start);
    titleCell.value = title;
    titleCell.font = { name: "Cambria", size: 12, bold: true };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
  });
  sheet.getRow(1).height = 24;

  const header = sheet.getRow(2);
  header.values = headers;
  header.height = 54;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.font = { name: "Cambria", size: 11, bold: true };
  });
  sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: headers.length } };
  sheet.pageSetup.printTitlesRow = "1:2";
}

export async function buildStatutoryRegister(params: {
  formType: RegisterFormType;
  societyName: string;
  registrationNumber: string;
  rows: StatutoryMemberRow[];
}): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ByelawsIndia";
  workbook.created = new Date();

  if (params.formType === "FORM_I") {
    const sheet = workbook.addWorksheet("Form I");
    addTitleAndHeaders(sheet, `FORM I REGISTER - ${params.societyName} (${params.registrationNumber})`, [
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
    ], 7);

    params.rows.forEach((member, index) => {
      sheet.addRow([
        index + 1,
        member.flatNumber,
        dateValue(member.admissionDate),
        dateValue(member.entranceFeePaidAt),
        member.fullName,
        member.address,
        member.occupation,
        member.ageAtAdmission,
        member.nomineeNameAddress,
        dateValue(member.nominationDate),
        dateValue(member.cessationDate),
        member.cessationReason,
        member.remark,
      ]);
    });

    formatSheet(sheet, [8, 12, 16, 20, 24, 30, 18, 18, 32, 16, 20, 22, 18], 2);
    sheet.getColumn(3).numFmt = "dd mmmm yyyy";
    sheet.getColumn(4).numFmt = "dd mmmm yyyy";
    sheet.getColumn(10).numFmt = "dd mmmm yyyy";
    sheet.getColumn(11).numFmt = "dd mmmm yyyy";
  } else {
    const sheet = workbook.addWorksheet("Form J");
    addTitleAndHeaders(sheet, `FORM J REGISTER - ${params.societyName} (${params.registrationNumber})`, [
      "Sr.No",
      "Flat No.",
      "Full Name of Member",
      "Address",
      "Class of Member",
      "Status",
    ]);

    params.rows.forEach((member, index) => {
      sheet.addRow([
        index + 1,
        member.flatNumber,
        member.fullName,
        member.address,
        member.memberClass,
        member.status,
      ]);
    });

    formatSheet(sheet, [8, 13, 28, 42, 22, 16]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
