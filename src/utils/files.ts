export const readFileAsDataUrl = (
  file?: File | null,
  options: { accept?: string[]; label?: string } = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const accept = options.accept ?? [];
    const isAllowed = accept.length === 0 || accept.some((type) => (type.endsWith("/*") ? file.type.startsWith(type.replace("/*", "/")) : file.type === type));
    if (!isAllowed) {
      reject(new Error(`Please upload a valid ${options.label ?? "file"}.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

export const readImageAsDataUrl = (file?: File | null): Promise<string> =>
  readFileAsDataUrl(file, { accept: ["image/*"], label: "image file" });

export const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  const headers = Object.keys(rows[0] ?? { Notice: "No data" });
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
