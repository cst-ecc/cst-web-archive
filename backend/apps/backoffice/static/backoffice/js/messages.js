(function () {
  const messages = document.querySelectorAll("[data-auto-dismiss-message]");

  messages.forEach((message) => {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "bo-message__close";
    closeButton.setAttribute("aria-label", "Fermer ce message");
    closeButton.innerHTML = "&times;";
    message.appendChild(closeButton);

    const dismiss = () => {
      if (message.classList.contains("is-hiding")) return;

      message.classList.add("is-hiding");

      window.setTimeout(() => {
        message.remove();
      }, 220);
    };

    closeButton.addEventListener("click", dismiss);
    window.setTimeout(dismiss, 6500);
  });
})();
