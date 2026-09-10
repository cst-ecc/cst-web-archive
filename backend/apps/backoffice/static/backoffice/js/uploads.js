(function () {
  function formatMb(bytes) {
    return (bytes / 1024 / 1024).toFixed(1).replace(".", ",");
  }

  function validateFileInput(input) {
    const files = Array.from(input.files || []);
    const maxFileMb = Number(input.dataset.maxFileMb || 0);
    const maxBatchMb = Number(input.dataset.maxBatchMb || 0);

    if (!files.length) {
      input.setCustomValidity("");
      return true;
    }

    const maxFileBytes = maxFileMb > 0 ? maxFileMb * 1024 * 1024 : 0;
    const maxBatchBytes = maxBatchMb > 0 ? maxBatchMb * 1024 * 1024 : 0;
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

    if (maxFileBytes > 0) {
      const tooLarge = files.find((file) => file.size > maxFileBytes);
      if (tooLarge) {
        input.setCustomValidity(
          `Le fichier « ${tooLarge.name} » dépasse ${maxFileMb} Mo.`,
        );
        return false;
      }
    }

    if (maxBatchBytes > 0 && totalBytes > maxBatchBytes) {
      input.setCustomValidity(
        `Le lot sélectionné pèse ${formatMb(totalBytes)} Mo. ` +
          `La limite est de ${maxBatchMb} Mo par envoi.`,
      );
      return false;
    }

    input.setCustomValidity("");
    return true;
  }

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type !== "file") return;
    if (!input.matches("[data-max-file-mb], [data-max-batch-mb]")) return;

    validateFileInput(input);
  });

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const fileInputs = Array.from(
        form.querySelectorAll(
          'input[type="file"][data-max-file-mb], input[type="file"][data-max-batch-mb]',
        ),
      );

      for (const input of fileInputs) {
        if (!validateFileInput(input)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          input.reportValidity();
          return;
        }
      }
    },
    true,
  );
})();
