(() => {
  const app = document.querySelector("[data-bo-app]");
  if (!app) return;

  const openButton = document.querySelector("[data-bo-sidebar-open]");
  const closeButton = document.querySelector("[data-bo-sidebar-close]");
  const overlay = document.querySelector("[data-bo-sidebar-overlay]");

  const open = () => {
    app.classList.add("is-sidebar-open");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    app.classList.remove("is-sidebar-open");
    document.body.style.overflow = "";
  };

  openButton?.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  overlay?.addEventListener("click", close);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) close();
  });
})();
