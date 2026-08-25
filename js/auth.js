(function exposeAuthServices(root, factory) {
  const profileApi =
    typeof module === "object" && module.exports
      ? require("./profile.js")
      : root.BracuProfile;
  const passwordPolicy =
    typeof module === "object" && module.exports
      ? require("../shared/password-policy.js")
      : root.BracuPasswordPolicy;
  const api = factory(profileApi, passwordPolicy);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AuthPageServices = api;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function buildAuthServices(profileApi, passwordPolicy) {
    "use strict";

    const DOMAIN_ERROR =
      "Please use your official BRAC University G-Suite email";
    const DOMAIN_ERROR_PATTERN =
      /Please use you?r? official BRAC University G-[Ss]uite email/;
    const MAX_PHOTO_BYTES = profileApi.MAX_PHOTO_BYTES;

    function shouldResumeStudentAuth(search) {
      return new URLSearchParams(search || "").get("recovery") !== "1";
    }

    function getOAuthCallbackError(search, hash) {
      const query = new URLSearchParams(search || "");
      const fragment = new URLSearchParams(
        String(hash || "").replace(/^#/, ""),
      );
      const description =
        query.get("error_description") ||
        fragment.get("error_description") ||
        "";
      if (!description) return "";
      return DOMAIN_ERROR_PATTERN.test(description)
        ? DOMAIN_ERROR
        : description;
    }

    function validatePhotoFile(file) {
      return profileApi.validatePhotoFile(file);
    }

    function selectPhotoCandidate(files) {
      const file = files && files[0] ? files[0] : null;
      const validation = validatePhotoFile(file);
      return { file, valid: validation.valid, error: validation.error };
    }

    function deriveOnboardingAvatarView({
      avatarPreference = "google",
      googleUrl = "",
      customUrl = "",
      customFileName = "",
    } = {}) {
      const googleActive = avatarPreference === "google" && Boolean(googleUrl);
      const customActive =
        avatarPreference === "custom" &&
        Boolean(customUrl) &&
        Boolean(customFileName);
      return Object.freeze({
        identityUrl: googleActive ? googleUrl : customActive ? customUrl : "",
        showGoogleRemove: googleActive,
        showCustomRemove: customActive,
        filename: customActive
          ? customFileName
          : "JPEG, PNG or WebP · max 5 MB",
        actionLabel: customActive ? "Replace" : "Choose photo",
      });
    }

    function buildOnboardingPayload(input, authCore) {
      const value = authCore.normalizeProfileInput(input);
      return profileApi.buildProfilePayload(
        {
          ...value,
          avatarPreference: input.avatarPreference || "google",
        },
        value.avatarPath || null,
      );
    }

    function createAuthController({
      client,
      authCore,
      config = {},
      location,
      getSessionContext,
      profileService,
    } = {}) {
      const currentLocation =
        location ||
        (typeof window !== "undefined"
          ? window.location
          : { href: "http://localhost/auth.html" });

      async function startStudentGoogleAuth() {
        const redirectTo = new URL(
          config.authPageUrl || "auth.html",
          currentLocation.href,
        ).href;
        const { error } = await client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
      }

      async function completeStudentOAuth() {
        let context;
        try {
          context = await getSessionContext({ verifyUser: true });
        } catch (error) {
          if (
            /user from sub claim in jwt does not exist/i.test(
              String((error && error.message) || error),
            )
          ) {
            try {
              await client.auth.signOut({ scope: "local" });
            } catch (_signOutError) {
              /* Local cleanup is best-effort. */
            }
            throw new Error(
              "Your previous session expired. Continue with Google again.",
            );
          }
          throw error;
        }
        if (!context || !context.user) return null;
        if (!authCore.isBracuGsuiteEmail(context.user.email)) {
          await client.auth.signOut();
          throw new Error(DOMAIN_ERROR);
        }
        return {
          context,
          route: authCore.resolvePostAuthRoute({
            role: context.role,
            status: context.profile && context.profile.status,
            onboardingCompleted: Boolean(
              context.profile && context.profile.onboarding_completed,
            ),
          }),
        };
      }

      async function submitOnboarding(input, file) {
        if (!profileService) throw new Error("Profile service is unavailable.");
        return profileService.submitOnboarding({
          ...input,
          photoFile: file || null,
        });
      }

      async function submitAdminLogin({ email, password, captchaToken }) {
        const normalizedEmail = String(email || "")
          .trim()
          .toLowerCase();
        if (!normalizedEmail || !password)
          throw new Error("Email and password are required.");
        if (!captchaToken)
          throw new Error("Complete the security verification.");
        const { error } = await client.auth.signInWithPassword({
          email: normalizedEmail,
          password,
          options: { captchaToken },
        });
        if (error) throw error;
        const context = await getSessionContext({ verifyUser: true });
        const activeAdmin =
          context &&
          context.profile &&
          context.profile.status === "active" &&
          (context.role === "admin" || context.role === "super_admin");
        if (!activeAdmin) {
          await client.auth.signOut();
          throw new Error("This is not an active administrator account.");
        }
        const { data: assurance, error: assuranceError } =
          await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (!assurance || assurance.currentLevel !== "aal2") {
          return `${config.authPageUrl || "auth.html"}?mode=admin&mfa=1`;
        }
        return config.adminPageUrl || "admin.html";
      }

      async function beginAdminMfa() {
        const context = await getSessionContext({ verifyUser: true });
        const activeAdmin =
          context &&
          context.profile &&
          context.profile.status === "active" &&
          (context.role === "admin" || context.role === "super_admin");
        if (!activeAdmin)
          throw new Error("An active administrator account is required.");

        const { data: assurance, error: assuranceError } =
          await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (assurance && assurance.currentLevel === "aal2") {
          return { mode: "verified", factorId: "", qrCode: "", secret: "" };
        }

        const { data: factorData, error: factorError } =
          await client.auth.mfa.listFactors();
        if (factorError) throw factorError;
        const verifiedFactor = ((factorData && factorData.totp) || []).find(
          (factor) => factor && factor.status === "verified",
        );
        if (verifiedFactor) {
          return {
            mode: "challenge",
            factorId: verifiedFactor.id,
            qrCode: "",
            secret: "",
          };
        }

        const { data: enrollment, error: enrollmentError } =
          await client.auth.mfa.enroll({
            factorType: "totp",
            issuer: "BRACU Course Tracker",
            friendlyName: "Admin access",
          });
        if (enrollmentError) throw enrollmentError;
        return {
          mode: "enroll",
          factorId: enrollment.id,
          qrCode: (enrollment.totp && enrollment.totp.qr_code) || "",
          secret: (enrollment.totp && enrollment.totp.secret) || "",
        };
      }

      async function verifyAdminMfa({ factorId, code }) {
        const normalizedCode = String(code || "").trim();
        if (!factorId) throw new Error("Authenticator setup is incomplete.");
        if (!/^\d{6}$/.test(normalizedCode)) {
          throw new Error("Enter the six-digit authenticator code.");
        }
        const { error } = await client.auth.mfa.challengeAndVerify({
          factorId,
          code: normalizedCode,
        });
        if (error) throw error;
        const { data: assurance, error: assuranceError } =
          await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assuranceError) throw assuranceError;
        if (!assurance || assurance.currentLevel !== "aal2") {
          throw new Error("Multi-factor verification was not completed.");
        }
        return config.adminPageUrl || "admin.html";
      }

      async function requestAdminPasswordReset(email, captchaToken) {
        const normalizedEmail = String(email || "")
          .trim()
          .toLowerCase();
        if (!normalizedEmail) throw new Error("Admin email is required.");
        if (!captchaToken)
          throw new Error("Complete the security verification.");
        const redirect = new URL(
          config.authPageUrl || "auth.html",
          currentLocation.href,
        );
        redirect.search = "?mode=admin&recovery=1";
        const { error } = await client.auth.resetPasswordForEmail(
          normalizedEmail,
          { redirectTo: redirect.href, captchaToken },
        );
        if (error) throw error;
      }

      async function completeAdminPasswordRecovery(password) {
        const validatedPassword = passwordPolicy.assertAdminPassword(password);
        const { error } = await client.auth.updateUser({
          password: validatedPassword,
        });
        if (error) throw error;
      }

      return Object.freeze({
        startStudentGoogleAuth,
        completeStudentOAuth,
        submitOnboarding,
        submitAdminLogin,
        beginAdminMfa,
        verifyAdminMfa,
        requestAdminPasswordReset,
        completeAdminPasswordRecovery,
      });
    }

    return Object.freeze({
      DOMAIN_ERROR,
      MAX_PHOTO_BYTES,
      validatePhotoFile,
      selectPhotoCandidate,
      deriveOnboardingAvatarView,
      shouldResumeStudentAuth,
      getOAuthCallbackError,
      buildOnboardingPayload,
      createAuthController,
    });
  },
);

(function initializeAuthPage(root) {
  "use strict";

  if (!root.document) return;

  const document = root.document;
  const reduceMotion = root.matchMedia("(prefers-reduced-motion: reduce)");
  const themeKey = "bracuCourseTracker.theme";
  let vantaEffect = null;
  let controller = null;
  let profileService = null;
  let onboardingAvatarDraft = null;
  let onboardingContext = null;
  let selectedPhotoFile = null;
  let selectedPhotoUrl = "";
  let turnstileWidgetId = null;
  let turnstileToken = "";
  let recoveryTurnstileWidgetId = null;
  let recoveryTurnstileToken = "";
  let recoveryMode = "request";
  let adminMfaFactorId = "";

  const $ = (selector) => document.querySelector(selector);
  const adminOnlyMode =
    new URLSearchParams(root.location.search).get("mode") === "admin";

  function refreshIcons() {
    if (root.lucide) root.lucide.createIcons();
  }

  function currentTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function vantaOptions() {
    const dark = currentTheme() === "dark";
    return {
      el: "#authBackground",
      THREE: root.THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
      color: dark ? 0x4f91ff : 0x1767d8,
      backgroundColor: dark ? 0x07162b : 0xeaf3ff,
      backgroundAlpha: 1,
      points: 20,
      maxDistance: 30,
      spacing: 17,
      showDots: true,
    };
  }

  function destroyAuthVanta() {
    if (!vantaEffect) return;
    vantaEffect.destroy();
    vantaEffect = null;
  }

  function initAuthVanta() {
    if (reduceMotion.matches || !root.VANTA || !root.VANTA.NET || !root.THREE) {
      destroyAuthVanta();
      return null;
    }
    if (!vantaEffect) vantaEffect = root.VANTA.NET(vantaOptions());
    else vantaEffect.setOptions(vantaOptions());
    return vantaEffect;
  }

  function setTheme(theme) {
    const safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = safeTheme;
    root.localStorage.setItem(themeKey, safeTheme);
    const toggle = $("#authThemeToggle");
    toggle.setAttribute(
      "aria-label",
      safeTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
    toggle.innerHTML = `<i data-lucide="${safeTheme === "dark" ? "sun" : "moon"}"></i>`;
    refreshIcons();
    initAuthVanta();
    if (root.turnstile) {
      if (turnstileWidgetId !== null) root.turnstile.remove(turnstileWidgetId);
      if (recoveryTurnstileWidgetId !== null)
        root.turnstile.remove(recoveryTurnstileWidgetId);
      turnstileWidgetId = null;
      turnstileToken = "";
      recoveryTurnstileWidgetId = null;
      recoveryTurnstileToken = "";
      if (document.body.dataset.authView === "admin") renderTurnstile("login");
      if (
        document.body.dataset.authView === "recovery" &&
        recoveryMode === "request"
      )
        renderTurnstile("recovery");
    }
  }

  function setAuthView(view) {
    const views = {
      student: "#studentAuthView",
      onboarding: "#studentOnboardingView",
      admin: "#adminAuthView",
      mfa: "#adminMfaView",
      recovery: "#adminRecoveryView",
    };
    Object.entries(views).forEach(([name, selector]) => {
      $(selector).hidden = name !== view;
    });
    document.body.dataset.authView = view;
    if (view === "admin") $("#adminEmail").focus({ preventScroll: true });
    if (view === "student")
      $("#studentGoogleButton").focus({ preventScroll: true });
    if (view === "mfa") $("#mfaCode").focus({ preventScroll: true });
    if (view === "admin") renderTurnstile("login");
    if (view === "recovery" && recoveryMode === "request")
      renderTurnstile("recovery");
    root.requestAnimationFrame(() => {
      if (vantaEffect) vantaEffect.resize();
    });
  }

  function renderTurnstile(kind = "login") {
    if (!root.turnstile) return;
    const recovery = kind === "recovery";
    if (
      (recovery && recoveryTurnstileWidgetId !== null) ||
      (!recovery && turnstileWidgetId !== null)
    )
      return;
    const widgetId = root.turnstile.render(
      recovery ? "#recoveryTurnstileContainer" : "#turnstileContainer",
      {
        sitekey: root.BRACU_CONFIG.turnstileSiteKey,
        theme: currentTheme(),
        size: "flexible",
        appearance: "always",
        action: recovery ? "admin_recovery" : "admin_login",
        callback(token) {
          if (recovery) recoveryTurnstileToken = token;
          else turnstileToken = token;
          showMessage(recovery ? "#recoveryMessage" : "#adminAuthError", "");
        },
        "expired-callback"() {
          if (recovery) recoveryTurnstileToken = "";
          else turnstileToken = "";
        },
        "error-callback"() {
          if (recovery) recoveryTurnstileToken = "";
          else turnstileToken = "";
          showMessage(
            recovery ? "#recoveryMessage" : "#adminAuthError",
            "Security verification could not load. Try again.",
          );
        },
      },
    );
    if (recovery) recoveryTurnstileWidgetId = widgetId;
    else turnstileWidgetId = widgetId;
  }

  function resetTurnstile(kind = "login") {
    const recovery = kind === "recovery";
    if (recovery) recoveryTurnstileToken = "";
    else turnstileToken = "";
    const widgetId = recovery ? recoveryTurnstileWidgetId : turnstileWidgetId;
    if (root.turnstile && widgetId !== null) root.turnstile.reset(widgetId);
  }

  function configureRecoveryView(mode) {
    recoveryMode = mode === "complete" ? "complete" : "request";
    const input = $("#recoveryEmail");
    const label = document.querySelector("label[for='recoveryEmail']");
    const button = $("#adminRecoveryForm button[type='submit'] span");
    const security = $("#recoveryTurnstileContainer");
    const passwordHint = $("#recoveryPasswordHint");
    security.hidden = recoveryMode === "complete";
    passwordHint.hidden = recoveryMode !== "complete";
    if (recoveryMode === "complete") {
      $("#recoveryCopy").textContent =
        "Choose a new password for your administrator account.";
      label.textContent = "New password";
      input.type = "password";
      input.name = "password";
      input.autocomplete = "new-password";
      input.minLength = passwordPolicy.MIN_LENGTH;
      input.setAttribute("aria-describedby", "recoveryPasswordHint");
      input.value = "";
      button.textContent = "Update password";
    } else {
      $("#recoveryCopy").textContent =
        "Enter the email assigned to your administrator account.";
      label.textContent = "Admin email";
      input.type = "email";
      input.name = "email";
      input.autocomplete = "email";
      input.removeAttribute("minlength");
      input.removeAttribute("aria-describedby");
      input.value = "";
      button.textContent = "Send recovery link";
      if (document.body.dataset.authView === "recovery")
        renderTurnstile("recovery");
    }
  }

  function populateYears() {
    const year = new Date().getFullYear();
    const select = $("#startingYear");
    for (let value = year + 1; value >= 2001; value -= 1) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = String(value);
      select.append(option);
    }
  }

  function showMessage(selector, message, tone = "error") {
    const element = $(selector);
    element.textContent = message || "";
    element.hidden = !message;
    element.dataset.tone = tone;
  }

  async function startAdminMfaFlow() {
    setAuthView("mfa");
    showMessage("#mfaMessage", "");
    try {
      const setup = await controller.beginAdminMfa();
      if (setup.mode === "verified") {
        root.location.replace(root.BRACU_CONFIG.adminPageUrl || "admin.html");
        return;
      }
      adminMfaFactorId = setup.factorId;
      const enrollment = setup.mode === "enroll";
      $("#mfaQrPanel").hidden = !enrollment;
      $("#mfaCopy").textContent = enrollment
        ? "Connect an authenticator app before entering your admin panel."
        : "Enter the six-digit code from your authenticator app.";
      if (enrollment) {
        $("#mfaQrCode").src = setup.qrCode;
        $("#mfaSecret").textContent = setup.secret;
      } else {
        $("#mfaQrCode").removeAttribute("src");
        $("#mfaSecret").textContent = "";
      }
      $("#mfaCode").focus({ preventScroll: true });
    } catch (error) {
      showMessage("#mfaMessage", error.message);
    }
  }

  function setButtonBusy(button, busy) {
    button.disabled = busy;
    button.setAttribute("aria-busy", String(busy));
  }

  function revokeSelectedPhotoUrl() {
    if (selectedPhotoUrl) URL.revokeObjectURL(selectedPhotoUrl);
    selectedPhotoUrl = "";
  }

  function clearSelectedPhotoInput() {
    revokeSelectedPhotoUrl();
    selectedPhotoFile = null;
    $("#profilePhoto").value = "";
  }

  function renderOnboardingAvatar() {
    if (!onboardingAvatarDraft || !onboardingContext) return;
    const draft = onboardingAvatarDraft.snapshot();
    const user = onboardingContext.user || {};
    const profile = root.BracuProfile.normalizeCanonicalProfile(
      onboardingContext.profile || {},
    );
    const name =
      profile.name || (user.user_metadata || {}).full_name || "Student";
    const initials = root.BracuProfile.getInitials(name);
    const googleUrl = root.BracuProfile.getGoogleAvatarUrl(user);
    const customUrl =
      draft.avatarPreference === "custom" && selectedPhotoFile
        ? selectedPhotoUrl
        : "";
    const view = root.AuthPageServices.deriveOnboardingAvatarView({
      avatarPreference: draft.avatarPreference,
      googleUrl,
      customUrl,
      customFileName: selectedPhotoFile?.name || "",
    });

    const identityImage = $("#onboardingIdentityImage");
    identityImage.hidden = !view.identityUrl;
    if (view.identityUrl) identityImage.src = view.identityUrl;
    else identityImage.removeAttribute("src");
    $("#onboardingInitials").hidden = Boolean(view.identityUrl);
    $("#onboardingInitials").textContent = initials;

    $("#photoFilename").textContent = view.filename;
    $("#photoActionLabel").textContent = view.actionLabel;
    $("#removeGooglePhoto").hidden = !view.showGoogleRemove;
    $("#removePhoto").hidden = !view.showCustomRemove;
    refreshIcons();
  }

  function applySelectedPhoto(file) {
    const candidate = root.AuthPageServices.selectPhotoCandidate(
      file ? [file] : [],
    );
    clearSelectedPhotoInput();
    if (!candidate.valid) {
      showMessage("#onboardingError", candidate.error);
      renderOnboardingAvatar();
      return false;
    }
    if (!candidate.file) {
      showMessage("#onboardingError", "");
      renderOnboardingAvatar();
      return true;
    }
    selectedPhotoFile = candidate.file;
    selectedPhotoUrl = URL.createObjectURL(candidate.file);
    onboardingAvatarDraft.chooseCustom(candidate.file);
    showMessage("#onboardingError", "");
    renderOnboardingAvatar();
    return true;
  }

  function presentOnboardingIdentity(context) {
    onboardingContext = context;
    clearSelectedPhotoInput();
    onboardingAvatarDraft = root.BracuProfile.createAvatarDraft({
      profile: context.profile,
      user: context.user,
    });
    const metadata = context.user.user_metadata || {};
    const name =
      (context.profile && context.profile.full_name) ||
      metadata.full_name ||
      metadata.name ||
      "Student";
    $("#onboardingName").textContent = name;
    $("#onboardingEmail").textContent = context.user.email || "";
    renderOnboardingAvatar();
  }

  async function resumeAuthenticatedStudent() {
    try {
      const result = await controller.completeStudentOAuth();
      if (!result) return;
      if (result.route === "auth.html?step=onboarding") {
        presentOnboardingIdentity(result.context);
        setAuthView("onboarding");
        return;
      }
      root.location.replace(result.route);
    } catch (error) {
      showMessage("#studentAuthError", error.message);
      setAuthView("student");
    }
  }

  function bindEvents() {
    $("#studentGoogleButton").addEventListener("click", async () => {
      const button = $("#studentGoogleButton");
      setButtonBusy(button, true);
      showMessage("#studentAuthError", "");
      try {
        await controller.startStudentGoogleAuth();
      } catch (error) {
        showMessage("#studentAuthError", error.message);
        setButtonBusy(button, false);
      }
    });
    $("#profilePhoto").addEventListener("change", (event) => {
      applySelectedPhoto(event.target.files && event.target.files[0]);
    });
    const dropzone = $("#photoDropzone");
    dropzone.addEventListener("dragenter", (event) => {
      event.preventDefault();
      dropzone.dataset.dragging = "true";
    });
    dropzone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropzone.dataset.dragging = "true";
    });
    dropzone.addEventListener("dragleave", (event) => {
      if (event.relatedTarget && dropzone.contains(event.relatedTarget)) return;
      dropzone.dataset.dragging = "false";
    });
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropzone.dataset.dragging = "false";
      applySelectedPhoto(
        event.dataTransfer &&
          event.dataTransfer.files &&
          event.dataTransfer.files[0],
      );
    });
    $("#removePhoto").addEventListener("click", () => {
      clearSelectedPhotoInput();
      onboardingAvatarDraft.chooseNone();
      renderOnboardingAvatar();
    });
    $("#removeGooglePhoto").addEventListener("click", () => {
      clearSelectedPhotoInput();
      onboardingAvatarDraft.chooseNone();
      renderOnboardingAvatar();
    });
    $("#onboardingForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      setButtonBusy(button, true);
      showMessage("#onboardingError", "");
      try {
        const avatar = onboardingAvatarDraft.snapshot();
        await controller.submitOnboarding(
          {
            studentId: $("#studentId").value,
            program: $("#program").value,
            startingTerm: $("#startingTerm").value,
            startingYear: $("#startingYear").value,
            avatarPreference: avatar.avatarPreference,
            avatarPath: avatar.avatarPath,
          },
          selectedPhotoFile,
        );
        await root.BracuSupabase.getSessionContext({ verifyUser: true });
        $("#authToast").dataset.show = "true";
        root.setTimeout(
          () => root.location.replace(root.BRACU_CONFIG.appPageUrl),
          reduceMotion.matches ? 150 : 1150,
        );
      } catch (error) {
        showMessage("#onboardingError", error.message);
        setButtonBusy(button, false);
      }
    });
    $("#openAdminView").addEventListener("click", () => setAuthView("admin"));
    $("#backToStudent").addEventListener("click", () => {
      if (!adminOnlyMode) setAuthView("student");
    });
    $("#forgotAdminPassword").addEventListener("click", () => {
      configureRecoveryView("request");
      setAuthView("recovery");
    });
    $("#backToAdmin").addEventListener("click", () => setAuthView("admin"));
    $("#authThemeToggle").addEventListener("click", () =>
      setTheme(currentTheme() === "dark" ? "light" : "dark"),
    );
    $("#toggleAdminPassword").addEventListener("click", () => {
      const input = $("#adminPassword");
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      $("#toggleAdminPassword").setAttribute(
        "aria-label",
        reveal ? "Hide password" : "Show password",
      );
      $("#toggleAdminPassword").innerHTML =
        `<i data-lucide="${reveal ? "eye-off" : "eye"}"></i>`;
      refreshIcons();
    });
    $("#adminLoginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      setButtonBusy(button, true);
      showMessage("#adminAuthError", "");
      try {
        const route = await controller.submitAdminLogin({
          email: $("#adminEmail").value,
          password: $("#adminPassword").value,
          captchaToken: turnstileToken,
        });
        root.location.replace(route);
      } catch (error) {
        showMessage("#adminAuthError", error.message);
        resetTurnstile();
        setButtonBusy(button, false);
      }
    });
    $("#adminMfaForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector("button[type='submit']");
      setButtonBusy(button, true);
      showMessage("#mfaMessage", "");
      try {
        const route = await controller.verifyAdminMfa({
          factorId: adminMfaFactorId,
          code: $("#mfaCode").value,
        });
        root.location.replace(route);
      } catch (error) {
        showMessage("#mfaMessage", error.message);
        $("#mfaCode").select();
        setButtonBusy(button, false);
      }
    });
    $("#mfaSignOut").addEventListener("click", async () => {
      await root.BracuSupabase.signOut();
      root.location.replace(
        `${root.BRACU_CONFIG.authPageUrl || "auth.html"}?mode=admin`,
      );
    });
    $("#adminRecoveryForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = $("#recoveryEmail");
      const button = event.currentTarget.querySelector("button[type='submit']");
      setButtonBusy(button, true);
      showMessage("#recoveryMessage", "");
      try {
        if (recoveryMode === "complete") {
          await controller.completeAdminPasswordRecovery(input.value);
          showMessage(
            "#recoveryMessage",
            "Password updated. You can now sign in.",
            "success",
          );
          root.setTimeout(() => {
            setAuthView("admin");
            configureRecoveryView("request");
          }, 700);
        } else {
          await controller.requestAdminPasswordReset(
            input.value,
            recoveryTurnstileToken,
          );
          showMessage(
            "#recoveryMessage",
            "If that administrator exists, a recovery link has been sent.",
            "success",
          );
        }
      } catch (error) {
        showMessage("#recoveryMessage", error.message);
      } finally {
        if (recoveryMode === "request") resetTurnstile("recovery");
        setButtonBusy(button, false);
      }
    });
    reduceMotion.addEventListener("change", initAuthVanta);
    root.addEventListener(
      "resize",
      () => {
        if (vantaEffect) vantaEffect.resize();
      },
      { passive: true },
    );
    root.addEventListener(
      "pagehide",
      () => {
        clearSelectedPhotoInput();
        destroyAuthVanta();
      },
      { once: true },
    );
  }

  async function boot() {
    const pageLoading = root.BracuUiStates.mountPageLoading({ source: "auth" });
    try {
      const storedTheme = root.localStorage.getItem(themeKey);
      const preferredTheme =
        storedTheme ||
        (root.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");
      const client = root.BracuSupabase.getClient();
      profileService = root.BracuProfile.createProfileService({
        client,
        getSessionContext: (options) =>
          root.BracuSupabase.getSessionContext(options),
      });
      controller = root.AuthPageServices.createAuthController({
        client,
        authCore: root.AuthCore,
        config: root.BRACU_CONFIG,
        location: root.location,
        getSessionContext: (options) =>
          root.BracuSupabase.getSessionContext(options),
        profileService,
      });
      populateYears();
      bindEvents();
      $("#backToStudent").hidden = adminOnlyMode;
      $("#openAdminView").hidden = adminOnlyMode;
      setTheme(preferredTheme);
      const params = new URLSearchParams(root.location.search);
      const oauthCallbackError = root.AuthPageServices.getOAuthCallbackError(
        root.location.search,
        root.location.hash,
      );
      if (oauthCallbackError) {
        showMessage("#studentAuthError", oauthCallbackError);
        setAuthView("student");
        root.history?.replaceState?.(
          {},
          document.title,
          root.BRACU_CONFIG.authPageUrl || "auth.html",
        );
        refreshIcons();
        return;
      }
      if (params.get("mfa") === "1") {
        await startAdminMfaFlow();
      } else if (params.get("recovery") === "1") {
        configureRecoveryView("complete");
        setAuthView("recovery");
      } else if (params.get("mode") === "admin") setAuthView("admin");
      client.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          configureRecoveryView("complete");
          setAuthView("recovery");
        }
      });
      refreshIcons();
      if (
        !adminOnlyMode &&
        root.AuthPageServices.shouldResumeStudentAuth(root.location.search)
      )
        await resumeAuthenticatedStudent();
    } catch (error) {
      pageLoading.markFailed("Sign in could not be loaded.");
      showMessage(
        "#studentAuthError",
        "Sign in could not be loaded. Refresh and try again.",
      );
      if (root.console?.error)
        root.console.error("Authentication page could not start.", error);
    } finally {
      pageLoading.markReady();
    }
  }

  root.AuthPage = Object.freeze({
    initAuthVanta,
    destroyAuthVanta,
    setAuthView,
  });
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(typeof globalThis !== "undefined" ? globalThis : window);
