(function exposeProfileModule(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BracuProfile = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildProfileModule(root) {
    "use strict";

    const PROGRAMS = Object.freeze([
      "BSc in Computer Science (CS)",
      "BSc in Computer Science & Engineering (CSE)",
    ]);
    const TERMS = Object.freeze(["Spring", "Summer", "Fall"]);
    const AVATAR_PREFERENCES = Object.freeze(["google", "custom", "none"]);
    const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
    const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

    function clean(value) {
      return String(value == null ? "" : value).trim();
    }

    function getInitials(name) {
      return (
        clean(name || "CS")
          .split(/\s+/)
          .filter(Boolean)
          .map((part) => part.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase() || "CS"
      );
    }

    function getGoogleAvatarUrl(user = {}) {
      const metadata = user.user_metadata || {};
      return clean(metadata.avatar_url || metadata.picture);
    }

    function normalizeCanonicalProfile(profile = {}) {
      const legacySemester = clean(
        profile.starting_semester || profile.startingSemester,
      );
      const legacyParts = legacySemester.match(
        /^(Spring|Summer|Fall)\s+(\d{4})$/,
      );
      const startingTerm = clean(
        profile.starting_term ||
          profile.startingTerm ||
          (legacyParts && legacyParts[1]),
      );
      const startingYear =
        Number(
          profile.starting_year ||
            profile.startingYear ||
            (legacyParts && legacyParts[2]),
        ) || 0;
      const rawPreference = clean(
        profile.avatar_preference || profile.avatarPreference,
      ).toLowerCase();
      const avatarPath = clean(profile.avatar_path || profile.avatarPath);
      const avatarPreference = AVATAR_PREFERENCES.includes(rawPreference)
        ? rawPreference
        : avatarPath
          ? "custom"
          : "google";
      return {
        name: clean(profile.full_name || profile.name),
        email: clean(profile.email).toLowerCase(),
        studentId: clean(profile.student_id || profile.studentId),
        program: clean(profile.program),
        university: "BRAC University",
        startingTerm,
        startingYear,
        startingSemester: [startingTerm, startingYear || ""]
          .filter(Boolean)
          .join(" "),
        avatarPreference,
        avatarPath: avatarPreference === "custom" ? avatarPath : "",
      };
    }

    function validatePhotoFile(file) {
      if (!file) return { valid: true, error: "" };
      if (!PHOTO_TYPES.has(file.type))
        return { valid: false, error: "Choose a JPEG, PNG, or WebP image." };
      if (Number(file.size) > MAX_PHOTO_BYTES)
        return {
          valid: false,
          error: "Profile photo must be 5 MB or smaller.",
        };
      return { valid: true, error: "" };
    }

    function createAvatarDraft({ profile = {}, user = {} } = {}) {
      const canonical = normalizeCanonicalProfile(profile);
      let avatarPreference = canonical.avatarPreference;
      let avatarPath = canonical.avatarPath;
      let photoFile = null;

      function snapshot() {
        return Object.freeze({
          avatarPreference,
          avatarPath,
          photoFile,
          googleAvatarUrl: getGoogleAvatarUrl(user),
        });
      }

      function chooseGoogle() {
        avatarPreference = "google";
        avatarPath = "";
        photoFile = null;
        return snapshot();
      }

      function chooseNone() {
        avatarPreference = "none";
        avatarPath = "";
        photoFile = null;
        return snapshot();
      }

      function chooseCustom(file) {
        const validation = validatePhotoFile(file);
        if (!validation.valid) throw new Error(validation.error);
        if (!file) throw new Error("Choose a profile photo.");
        avatarPreference = "custom";
        avatarPath = "";
        photoFile = file;
        return snapshot();
      }

      return Object.freeze({
        snapshot,
        chooseGoogle,
        chooseNone,
        chooseCustom,
      });
    }

    function createAvatarRuntime({ client, urlApi = root.URL } = {}) {
      let currentObjectUrl = "";

      function revokeCurrent() {
        if (
          currentObjectUrl &&
          urlApi &&
          typeof urlApi.revokeObjectURL === "function"
        ) {
          urlApi.revokeObjectURL(currentObjectUrl);
        }
        currentObjectUrl = "";
      }

      async function resolve(profile = {}, user = {}) {
        revokeCurrent();
        const canonical = normalizeCanonicalProfile(profile);
        const initials = getInitials(
          canonical.name || (user.user_metadata || {}).full_name || user.email,
        );
        const fallback = (error) => ({
          kind: "initials",
          src: "",
          initials,
          external: false,
          error: error || null,
        });

        if (canonical.avatarPreference === "none") return fallback(null);
        if (canonical.avatarPreference === "google") {
          const src = getGoogleAvatarUrl(user);
          return src
            ? { kind: "image", src, initials, external: true, error: null }
            : fallback(null);
        }
        if (!canonical.avatarPath || !client || !client.storage)
          return fallback(new Error("Custom profile photo is unavailable."));

        const { data, error } = await client.storage
          .from("profile-photos")
          .download(canonical.avatarPath);
        if (error || !data)
          return fallback(
            error || new Error("Custom profile photo is unavailable."),
          );
        currentObjectUrl = urlApi.createObjectURL(data);
        return {
          kind: "image",
          src: currentObjectUrl,
          initials,
          external: false,
          error: null,
        };
      }

      return Object.freeze({ resolve, dispose: revokeCurrent });
    }

    function loadImage(file) {
      return new Promise((resolve, reject) => {
        if (!root.Image || !root.URL || !root.URL.createObjectURL) {
          reject(new Error("Image processing is unavailable."));
          return;
        }
        const image = new root.Image();
        const url = root.URL.createObjectURL(file);
        image.onload = () => {
          root.URL.revokeObjectURL(url);
          resolve(image);
        };
        image.onerror = () => {
          root.URL.revokeObjectURL(url);
          reject(new Error("Could not read that image."));
        };
        image.src = url;
      });
    }

    async function compressProfilePhoto(file) {
      const validation = validatePhotoFile(file);
      if (!validation.valid) throw new Error(validation.error);
      const image = await loadImage(file);
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const scale = Math.min(1, 512 / width, 512 / height);
      const canvas = root.document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      canvas
        .getContext("2d", { alpha: false })
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("Could not prepare that image.")),
          "image/webp",
          0.86,
        ),
      );
    }

    function buildProfilePayload(input = {}, avatarPath = null) {
      const studentId = clean(input.studentId);
      const program = clean(input.program);
      const startingTerm = clean(input.startingTerm);
      const startingYear = Number(input.startingYear) || 0;
      const avatarPreference = clean(
        input.avatarPreference || "google",
      ).toLowerCase();
      if (!studentId) throw new Error("Student ID is required.");
      if (!PROGRAMS.includes(program))
        throw new Error("Select an approved program.");
      if (!TERMS.includes(startingTerm))
        throw new Error("Select a starting term.");
      if (startingYear < 2001 || startingYear > 2100)
        throw new Error("Select a valid starting year.");
      if (!AVATAR_PREFERENCES.includes(avatarPreference))
        throw new Error("Select a valid profile photo preference.");
      if (avatarPreference === "custom" && !clean(avatarPath))
        throw new Error("Choose a custom profile photo.");
      return {
        student_id: studentId,
        program,
        starting_term: startingTerm,
        starting_year: startingYear,
        avatar_preference: avatarPreference,
        avatar_path: avatarPreference === "custom" ? clean(avatarPath) : null,
      };
    }

    function createProfileService({
      client,
      getSessionContext,
      compressPhoto = compressProfilePhoto,
      clock = () => Date.now(),
      nonce = () => Math.random().toString(36).slice(2, 10),
    } = {}) {
      const bucket = () => client.storage.from("profile-photos");

      async function removePaths(paths) {
        const values = [...new Set(paths.filter(Boolean))];
        if (!values.length) return;
        const { error } = await bucket().remove(values);
        if (error && root.console && root.console.warn)
          root.console.warn(
            "A superseded profile photo could not be removed.",
            error,
          );
      }

      async function save(rpcName, input) {
        const context = await getSessionContext({ verifyUser: true });
        if (!context || !context.user)
          throw new Error("Your session has expired. Please sign in again.");
        const previous = normalizeCanonicalProfile(context.profile || {});
        const requestedPreference = clean(
          input.avatarPreference || previous.avatarPreference || "google",
        ).toLowerCase();
        let nextPath =
          requestedPreference === "custom"
            ? clean(input.avatarPath || previous.avatarPath)
            : "";
        let uploadedPath = "";

        if (requestedPreference === "custom" && input.photoFile) {
          const validation = validatePhotoFile(input.photoFile);
          if (!validation.valid) throw new Error(validation.error);
          const blob = await compressPhoto(input.photoFile);
          uploadedPath = `${context.user.id}/avatar-${clock()}-${nonce()}.webp`;
          const { error } = await bucket().upload(uploadedPath, blob, {
            contentType: "image/webp",
            upsert: false,
            cacheControl: "3600",
          });
          if (error) throw error;
          nextPath = uploadedPath;
        }

        let payload;
        try {
          payload = buildProfilePayload(
            { ...input, avatarPreference: requestedPreference },
            nextPath,
          );
          const { data, error } = await client.rpc(rpcName, payload);
          if (error) throw error;
          if (
            previous.avatarPreference === "custom" &&
            previous.avatarPath &&
            previous.avatarPath !== nextPath
          ) {
            await removePaths([previous.avatarPath]);
          }
          return data;
        } catch (error) {
          if (uploadedPath) await removePaths([uploadedPath]);
          throw error;
        }
      }

      return Object.freeze({
        submitOnboarding(input) {
          return save("complete_student_onboarding", input);
        },
        updateStudentProfile(input) {
          return save("update_student_profile", input);
        },
      });
    }

    return Object.freeze({
      PROGRAMS,
      TERMS,
      AVATAR_PREFERENCES,
      MAX_PHOTO_BYTES,
      normalizeCanonicalProfile,
      getGoogleAvatarUrl,
      getInitials,
      validatePhotoFile,
      createAvatarDraft,
      createAvatarRuntime,
      compressProfilePhoto,
      buildProfilePayload,
      createProfileService,
    });
  },
);
