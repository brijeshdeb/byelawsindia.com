export interface RenderedTemplate {
  output: string;
  missingVariables: string[];
}

const TOKEN_PATTERN = /{{\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*}}/g;

function valueAtPath(data: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}

export function templateVariables(template: string): string[] {
  return Array.from(template.matchAll(TOKEN_PATTERN), (match) => match[1])
    .filter((value): value is string => Boolean(value))
    .filter((value, index, values) => values.indexOf(value) === index);
}

export function renderTemplate(
  template: string,
  data: Record<string, unknown>,
  options: { requireAll?: boolean } = {}
): RenderedTemplate {
  const missing = new Set<string>();
  const output = template.replace(TOKEN_PATTERN, (token, path: string) => {
    const value = valueAtPath(data, path);
    if (value === undefined || value === null || value === "") {
      missing.add(path);
      return token;
    }
    return String(value);
  });

  const missingVariables = Array.from(missing);
  if ((options.requireAll ?? true) && missingVariables.length > 0) {
    throw new Error(`Missing template values: ${missingVariables.join(", ")}`);
  }

  return { output, missingVariables };
}
