import { describe, expect, it } from "vitest";
import { renderTemplate, templateVariables } from "@/lib/templates/render";

describe("template renderer", () => {
  it("extracts unique variables and supports whitespace", () => {
    expect(templateVariables("Hi {{ name }}, {{name}} in {{society.city}}"))
      .toEqual(["name", "society.city"]);
  });

  it("renders scalar and nested values", () => {
    expect(renderTemplate("{{member}} - {{society.name}}", {
      member: "Asha",
      society: { name: "Sunrise CHS" },
    }).output).toBe("Asha - Sunrise CHS");
  });

  it("refuses to issue a document with unresolved values", () => {
    expect(() => renderTemplate("Unit {{unit}} / {{member}}", { unit: "A-101" }))
      .toThrow("Missing template values: member");
  });

  it("can preserve missing placeholders for draft previews", () => {
    expect(renderTemplate("Dear {{name}}", {}, { requireAll: false }))
      .toEqual({ output: "Dear {{name}}", missingVariables: ["name"] });
  });
});
