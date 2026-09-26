(function () {
  const form = document.querySelector("[data-document-bulk-form]");
  if (!(form instanceof HTMLFormElement)) return;

  const selectAll = form.querySelector("[data-document-select-all]");
  const checkboxes = Array.from(
    form.querySelectorAll("[data-document-checkbox]"),
  );
  const bulkBar = form.querySelector("[data-document-bulk-bar]");
  const selectedCount = form.querySelector("[data-document-selected-count]");
  const clearButton = form.querySelector("[data-document-clear-selection]");

  if (!(selectAll instanceof HTMLInputElement) || !checkboxes.length) return;

  function selectedCheckboxes() {
    return checkboxes.filter((checkbox) => checkbox.checked);
  }

  function updateState() {
    const selected = selectedCheckboxes();
    const count = selected.length;

    selectAll.checked = count === checkboxes.length && count > 0;
    selectAll.indeterminate = count > 0 && count < checkboxes.length;

    if (selectedCount) selectedCount.textContent = String(count);
    if (bulkBar) bulkBar.hidden = count === 0;

    checkboxes.forEach((checkbox) => {
      const row = checkbox.closest("[data-document-row]");
      if (row) row.classList.toggle("is-selected", checkbox.checked);
    });
  }

  selectAll.addEventListener("change", () => {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selectAll.checked;
    });
    updateState();
  });

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateState);
  });

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      selectAll.checked = false;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
      updateState();
    });
  }

  document.addEventListener(
    "submit",
    (event) => {
      if (event.target !== form) return;

      const selected = selectedCheckboxes();
      if (!selected.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.alert("Sélectionnez au moins un document.");
        return;
      }

      const submitter = event.submitter;
      if (!(submitter instanceof HTMLButtonElement)) return;

      const count = selected.length;
      let message = "";

      if (submitter.value === "make_confidential") {
        message =
          `Rendre ${count} document(s) confidentiel(s) ?\n\n` +
          "Ces documents ne seront plus accessibles publiquement. " +
          "Les visiteurs devront demander une autorisation pour les consulter.";
      } else if (submitter.value === "make_public") {
        message =
          `Rendre ${count} document(s) public(s) ?\n\n` +
          "Ils redeviendront accessibles sans demande d’autorisation. " +
          "Les autorisations temporaires existantes seront révoquées et " +
          "les demandes encore en attente seront clôturées.";
      }

      if (message && !window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  updateState();
})();
