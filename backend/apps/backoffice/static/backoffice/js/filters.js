(function () {
  const forms = document.querySelectorAll("[data-auto-submit-filter]");

  forms.forEach((form) => {
    let timer = null;
    const submit = () => {
      if (timer) window.clearTimeout(timer);
      form.requestSubmit();
    };

    const debouncedSubmit = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        form.requestSubmit();
      }, 380);
    };

    form.querySelectorAll("input[type='search']").forEach((input) => {
      input.addEventListener("input", debouncedSubmit);
    });

    form.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", submit);
    });
  });
})();
