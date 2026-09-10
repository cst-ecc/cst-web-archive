(function () {
  const SUBMIT_SELECTOR =
    'button[type="submit"], input[type="submit"], button:not([type])';

  function makeDots() {
    const dots = document.createElement("span");
    dots.className = "bo-loader-dots";
    dots.setAttribute("aria-hidden", "true");

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dots.appendChild(dot);
    }

    return dots;
  }

  function activateButton(button) {
    if (!button || button.dataset.loading === "true") return;

    button.dataset.loading = "true";
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");

    if (button.tagName === "INPUT") {
      button.dataset.originalValue = button.value || "";
      button.value = "Traitement…";
      return;
    }

    button.dataset.originalHtml = button.innerHTML;
    const label = document.createElement("span");
    label.className = "bo-loader-label";
    label.textContent = button.textContent.trim() || "Traitement";

    button.replaceChildren(label, makeDots());
  }

  function disableOtherButtons(form, activeButton) {
    form.querySelectorAll(SUBMIT_SELECTOR).forEach((button) => {
      if (button !== activeButton) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
      }
    });
  }

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      // Les filtres dynamiques doivent rester discrets : pas de loader visuel.
      if (
        form.dataset.noLoader === "true" ||
        form.hasAttribute("data-auto-submit-filter")
      ) {
        return;
      }

      if (form.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }

      if (!form.noValidate && !form.checkValidity()) {
        return;
      }

      const submitter =
        event.submitter instanceof HTMLElement
          ? event.submitter
          : document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

      const activeButton =
        submitter && submitter.matches(SUBMIT_SELECTOR)
          ? submitter
          : form.querySelector(SUBMIT_SELECTOR);

      form.dataset.submitting = "true";
      form.setAttribute("aria-busy", "true");

      if (activeButton) {
        activateButton(activeButton);
        disableOtherButtons(form, activeButton);
      }
    },
    true,
  );
})();
