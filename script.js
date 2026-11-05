document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("#menu-toggle");

  // Main navigation shared by every page.
  const navigationLinks = [
    ["Home", "index.html"],
    ["Library", "articles.html"],
    ["Growing & Greener Living", "growing-greener-living.html"],
    ["Energy & Water Smarts", "energy-water-smarts.html"],
    ["Waste Less", "waste-less.html"],
    ["Smarter Spending", "smarter-spending.html"],
    ["Food & Everyday Eating", "food-everyday-eating.html"],
    ["Mind & Wellbeing", "mind-wellbeing.html"],
    ["Quests", "quests.html"],
    ["Community", "community.html"],
    ["Profile", "profile.html"]
  ];

  // Build the menu when the hamburger button is clicked.
  if (menuButton) {
    let menu = document.querySelector("#site-menu");

    if (!menu) {
      menu = document.createElement("nav");
      menu.id = "site-menu";
      menu.className = "site-menu";
      menu.setAttribute("aria-label", "Main navigation");

      navigationLinks.forEach(([label, url]) => {
        const link = document.createElement("a");
        link.href = url;
        link.textContent = label;
        menu.appendChild(link);
      });

      document.querySelector(".topbar")?.insertAdjacentElement(
        "afterend",
        menu
      );
    }

    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");

    menuButton.addEventListener("click", () => {
      const isOpen = menu.hidden;

      menu.hidden = !isOpen;
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );
    });

    document.addEventListener("click", (event) => {
      if (
        !menu.hidden &&
        !menu.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        menu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        menuButton.focus();
      }
    });
  }

  // Highlight the current page in the navigation.
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("#site-menu a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });

  // Article search: searches titles and summaries.
  const searchInputs = document.querySelectorAll("[data-article-search]");

  searchInputs.forEach((input) => {
    const searchArea = input.closest("[data-search-area]") || document;

    input.addEventListener("input", () => {
      const searchTerm = input.value.trim().toLowerCase();

      const articles = searchArea.querySelectorAll("[data-article-item]");
      let visibleCount = 0;

      articles.forEach((article) => {
        const searchableText = (
          article.dataset.title +
          " " +
          article.dataset.summary
        ).toLowerCase();

        const matches = searchableText.includes(searchTerm);

        article.hidden = !matches;

        if (matches) {
          visibleCount++;
        }
      });

      const emptyMessage = searchArea.querySelector("[data-no-results]");

      if (emptyMessage) {
        emptyMessage.hidden = visibleCount !== 0;
      }
    });
  });
});
