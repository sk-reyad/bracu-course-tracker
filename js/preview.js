(function exposePreviewModule(root, factory) {
  const moduleApi = factory();
  if (typeof module === "object" && module.exports) module.exports = moduleApi;
  else
    root.BracuPreview = moduleApi.createPreviewManager({
      defaultData: root.DEFAULT_DATA,
    });
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildPreviewModule() {
    "use strict";

    function clone(value) {
      if (typeof structuredClone === "function") return structuredClone(value);
      return JSON.parse(JSON.stringify(value));
    }

    function createPreviewManager({ defaultData = {} } = {}) {
      function createSanitizedState() {
        return {
          profile: {
            name: "Preview Student",
            email: "preview@g.bracu.ac.bd",
            studentId: "24000000",
            program: "BSc in Computer Science (CS)",
            startingSemester: "Fall 2024",
            profilePhoto: "",
          },
          courses: clone(defaultData.courses || []),
          departments: clone(defaultData.departments || []),
          gradeScale: clone(defaultData.gradeScale || []),
          faculties: clone(defaultData.defaultFaculties || []),
          semesters: clone(defaultData.defaultSemesters || []),
          settings: {
            theme: "light",
            autoCountHighestRetake: true,
            lastUpdated: new Date().toISOString(),
            cloudSync: { provider: "preview-disabled" },
          },
        };
      }

      function guardMutation() {
        return false;
      }

      function applyLockdown(documentRef) {
        if (!documentRef || !documentRef.body) return;
        documentRef.body.classList.add("preview-mode");
        const selectors = [
          "#addSemesterBtn",
          "#saveSemesterBtn",
          "#addCourseBtn",
          "#addDepartmentBtn",
          "#quickAddForm button[type='submit']",
          "[data-action^='delete-']",
          "[data-action^='edit-']",
          "[data-action^='remove-']",
          "[data-action='save-attempt']",
          "[data-action='update-attempt']",
        ];
        documentRef.querySelectorAll(selectors.join(",")).forEach((element) => {
          element.disabled = true;
          element.setAttribute("aria-disabled", "true");
          element.setAttribute("title", "Preview mode is read-only");
        });
        if (!documentRef.getElementById("previewModeBanner")) {
          const banner = documentRef.createElement("div");
          banner.id = "previewModeBanner";
          banner.className = "preview-mode-banner";
          banner.setAttribute("role", "status");
          banner.innerHTML =
            '<span>Preview mode</span><strong>Explore the tracker with sample data.</strong><a href="auth.html">Sign in to use your own dashboard</a>';
          documentRef.body.prepend(banner);
        }
      }

      return Object.freeze({
        createSanitizedState,
        guardMutation,
        applyLockdown,
      });
    }

    return Object.freeze({ createPreviewManager });
  },
);
