(function exposeReportPdf(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuReportPdf = Object.freeze(api);
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildReportPdfApi() {
    function buildOptions(filename) {
      return {
        margin: [0.5, 0.4, 0.5, 0.4],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: {
          mode: ["css", "legacy"],
          avoid: [".report-semester-block", ".report-planned-block"],
        },
      };
    }

    async function download({ html2pdf, element, filename }) {
      if (typeof html2pdf !== "function")
        throw new Error("PDF generator is unavailable");
      await html2pdf().set(buildOptions(filename)).from(element).save();
    }

    return { buildOptions, download };
  },
);
