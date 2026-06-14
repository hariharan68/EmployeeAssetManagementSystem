import axiosInstance from "./axiosInstance";

// Downloads a PDF from the given report endpoint using the auth token,
// then triggers a browser "Save as" via a temporary blob URL.
const downloadPdf = async (url, filename) => {
  const response = await axiosInstance.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(
    new Blob([response.data], { type: "application/pdf" })
  );
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const downloadEmployeeReport = (employeeId, name = "") =>
  downloadPdf(`/api/reports/employee/${employeeId}`,
    `employee_${name || employeeId}_report.pdf`);

export const downloadAssetReport = (assetId, name = "") =>
  downloadPdf(`/api/reports/asset/${assetId}`,
    `asset_${name || assetId}_report.pdf`);

export const downloadEmployeesReport = () =>
  downloadPdf("/api/reports/employees", "employees_report.pdf");

export const downloadAssetsReport = () =>
  downloadPdf("/api/reports/assets", "assets_report.pdf");
