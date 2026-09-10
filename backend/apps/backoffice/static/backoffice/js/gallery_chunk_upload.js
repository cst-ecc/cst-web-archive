(function () {
  function makeDots() {
    const dots = document.createElement("span");
    dots.className = "bo-loader-dots";
    dots.setAttribute("aria-hidden", "true");

    for (let index = 0; index < 3; index += 1) {
      dots.appendChild(document.createElement("span"));
    }

    return dots;
  }

  function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalHtml) {
        button.dataset.originalHtml = button.innerHTML;
      }
      const label = document.createElement("span");
      label.className = "bo-loader-label";
      label.textContent = "Upload en cours";
      button.replaceChildren(label, makeDots());
      button.disabled = true;
      button.classList.add("is-loading");
      return;
    }

    button.disabled = false;
    button.classList.remove("is-loading");
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }

  function formatMb(bytes) {
    return (bytes / 1024 / 1024).toFixed(1).replace(".", ",");
  }

  function createRow(list, file) {
    const row = document.createElement("article");
    row.className = "bo-upload-row";
    row.innerHTML = `
      <div class="bo-upload-row__head">
        <strong></strong>
        <span></span>
      </div>
      <div class="bo-upload-progress" aria-hidden="true">
        <span></span>
      </div>
      <p class="bo-upload-row__status">En attente</p>
    `;
    row.querySelector("strong").textContent = file.name;
    row.querySelector(".bo-upload-row__head span").textContent =
      `${formatMb(file.size)} Mo`;
    list.appendChild(row);
    return row;
  }

  function updateRow(row, percent, text, state) {
    row.querySelector(".bo-upload-progress span").style.width = `${percent}%`;
    row.querySelector(".bo-upload-row__status").textContent = text;
    row.dataset.state = state || "";
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.ok === false) {
      throw new Error(payload.error || `Erreur HTTP ${response.status}`);
    }

    return payload;
  }

  async function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function pollStatus(statusUrl, csrfToken, row) {
    for (;;) {
      const payload = await fetchJson(statusUrl, {
        method: "GET",
        headers: { "X-CSRFToken": csrfToken },
      });

      if (payload.status === "completed") {
        updateRow(row, 100, "Terminé", "done");
        return payload;
      }

      if (payload.status === "failed") {
        throw new Error(payload.error || "Le traitement de l’image a échoué.");
      }

      const label =
        payload.status === "queued"
          ? "En attente de traitement"
          : payload.status === "processing"
            ? "Compression en cours"
            : "Upload en cours";

      updateRow(row, Math.max(payload.progress || 0, 96), label, "processing");
      await sleep(1200);
    }
  }

  async function uploadFile({ file, uploader, csrfToken, chunkSize, row }) {
    const totalChunks = Math.ceil(file.size / chunkSize);

    const session = await fetchJson(uploader.dataset.startUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
        chunkSize,
        totalChunks,
      }),
    });

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("chunk", chunk, file.name);

      const payload = await fetchJson(session.chunkUrl, {
        method: "POST",
        headers: { "X-CSRFToken": csrfToken },
        body: formData,
      });

      updateRow(
        row,
        payload.progress || Math.round(((chunkIndex + 1) / totalChunks) * 100),
        `Morceau ${chunkIndex + 1}/${totalChunks}`,
        "uploading",
      );
    }

    const completed = await fetchJson(session.completeUrl, {
      method: "POST",
      headers: { "X-CSRFToken": csrfToken },
    });

    if (completed.status === "completed") {
      updateRow(row, 100, "Terminé", "done");
      return completed;
    }

    updateRow(row, 96, "Compression en attente", "processing");
    return pollStatus(completed.statusUrl, csrfToken, row);
  }

  document.querySelectorAll("[data-gallery-chunk-uploader]").forEach((uploader) => {
    const input = uploader.querySelector("[data-gallery-files]");
    const button = uploader.querySelector("[data-gallery-upload-button]");
    const list = uploader.querySelector("[data-gallery-upload-list]");

    if (!input || !button || !list) return;

    button.addEventListener("click", async () => {
      const files = Array.from(input.files || []);
      const csrfToken = uploader.dataset.csrfToken;
      const chunkSize = Number(uploader.dataset.chunkSize || 8 * 1024 * 1024);
      const maxFileMb = Number(uploader.dataset.maxFileMb || 150);
      const maxFiles = Number(uploader.dataset.maxFiles || 200);

      if (!files.length) {
        input.setCustomValidity("Sélectionnez au moins une image.");
        input.reportValidity();
        return;
      }

      if (files.length > maxFiles) {
        input.setCustomValidity(
          `Vous ne pouvez pas sélectionner plus de ${maxFiles} fichiers à la fois.`,
        );
        input.reportValidity();
        return;
      }

      const maxFileBytes = maxFileMb * 1024 * 1024;
      const tooLarge = files.find((file) => file.size > maxFileBytes);
      if (tooLarge) {
        input.setCustomValidity(
          `Le fichier « ${tooLarge.name} » dépasse ${maxFileMb} Mo.`,
        );
        input.reportValidity();
        return;
      }

      input.setCustomValidity("");
      list.innerHTML = "";
      setButtonLoading(button, true);

      let hasError = false;

      for (const file of files) {
        const row = createRow(list, file);

        try {
          await uploadFile({
            file,
            uploader,
            csrfToken,
            chunkSize,
            row,
          });
        } catch (error) {
          hasError = true;
          updateRow(row, 100, error.message || "Erreur d’upload", "error");
        }
      }

      setButtonLoading(button, false);

      if (!hasError) {
        window.setTimeout(() => {
          window.location.reload();
        }, 900);
      }
    });
  });
})();
