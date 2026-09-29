(() => {
  const app = document.querySelector("[data-admin-layout]");
  if (!app) return;

  const toggle = document.querySelector("[data-sidebar-toggle]");
  const collapse = document.querySelector("[data-sidebar-collapse]");
  const backdrop = document.querySelector("[data-sidebar-backdrop]");
  const desktopQuery = window.matchMedia("(min-width: 1024px)");
  const storageKey = "cst_backoffice_sidebar_collapsed";

  const closeMobile = () => {
    app.classList.remove("is-mobile-open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  const restoreDesktop = () => {
    if (!desktopQuery.matches) {
      app.classList.remove("is-collapsed");
      return;
    }
    try {
      app.classList.toggle("is-collapsed", localStorage.getItem(storageKey) === "1");
    } catch (_) {
      app.classList.remove("is-collapsed");
    }
  };

  toggle?.addEventListener("click", () => {
    const open = !app.classList.contains("is-mobile-open");
    app.classList.toggle("is-mobile-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  collapse?.addEventListener("click", () => {
    const collapsed = !app.classList.contains("is-collapsed");
    app.classList.toggle("is-collapsed", collapsed);
    try { localStorage.setItem(storageKey, collapsed ? "1" : "0"); } catch (_) {}
  });

  backdrop?.addEventListener("click", closeMobile);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobile();
  });
  document.querySelectorAll(".bo-nav__item").forEach((link) => link.addEventListener("click", closeMobile));
  desktopQuery.addEventListener?.("change", () => {
    closeMobile();
    restoreDesktop();
  });

  restoreDesktop();
})();
