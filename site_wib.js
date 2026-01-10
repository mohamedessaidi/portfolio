// site_wib.js — small UI enhancements: mobile menu, smooth scroll, reveal-on-scroll
(function () {
  "use strict";

  // Create a mobile menu toggle button and wire it to show/hide nav
  function initMobileMenu() {
    const header = document.querySelector(".site-header .container");
    const nav = document.querySelector(".site-header nav");
    if (!header || !nav) return;

    const btn = document.createElement("button");
    btn.className = "menu-toggle";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Toggle navigation");
    btn.innerHTML = '<i class="bx bx-menu"></i>';

    // style fallback (minimal) so button is visible without changing CSS file
    Object.assign(btn.style, {
      background: "transparent",
      border: "none",
      color: "var(--text)",
      fontSize: "1.25rem",
      cursor: "pointer",
      padding: "6px",
    });

    header.insertBefore(btn, header.firstChild);

    function setNav(open) {
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        nav.style.display = "block";
      } else {
        nav.style.display = "";
      }
    }

    btn.addEventListener("click", function () {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      setNav(!expanded);
    });

    // Close nav when clicking outside (mobile)
    document.addEventListener("click", function (e) {
      if (
        !header.contains(e.target) &&
        window.getComputedStyle(nav).display === "block"
      ) {
        setNav(false);
      }
    });

    // Ensure nav visibility resets on resize
    window.addEventListener("resize", function () {
      if (window.innerWidth > 600) nav.style.display = "";
    });
  }

  // Smooth scroll for same-page anchors
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (href === "#") return; // allow deliberate top anchors
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        // update focus for accessibility
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        window.history.replaceState(null, "", href);
      }
    });
  }

  // Reveal elements on scroll using IntersectionObserver
  function initRevealOnScroll() {
    // support both hyphen and underscore class names for compatibility
    const els = document.querySelectorAll(
      ".project-card, .hero, .work h2, .about-me, .social-media, .social_media, .site-footer"
    );
    if (!("IntersectionObserver" in window) || els.length === 0) {
      // fallback: simply make visible
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            o.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    els.forEach((el) => {
      el.classList.add("will-reveal");
      obs.observe(el);
    });
  }

  // Improve external links security and open in new tab
  function initExternalLinks() {
    const links = document.querySelectorAll('a[href^="http"]');
    links.forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }

  // Small utilities: add basic reveal CSS rules dynamically
  function injectHelpers() {
    const css = `
			.will-reveal{opacity:0;transform:translateY(10px);transition:opacity .6s ease, transform .6s ease}
			.revealed{opacity:1;transform:none}
			.menu-toggle:focus{outline:3px solid rgba(125,211,252,0.12);outline-offset:4px}

			/* hide menu toggle on desktop, show on small screens */
			.menu-toggle{display:none}
			@media (max-width:600px){
				.menu-toggle{display:inline-block}
			}
		`;
    const s = document.createElement("style");
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  // Theme toggle: create button, persist choice in localStorage, and apply `[data-theme="light"]`
  function initThemeToggle() {
    const header = document.querySelector(".site-header .container");
    if (!header) return;
    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle theme");
    btn.setAttribute("aria-pressed", "false");
    const icon = document.createElement("i");
    icon.className = "bx bx-moon";
    btn.appendChild(icon);

    function setTheme(theme) {
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        icon.className = "bx bx-sun";
        btn.setAttribute("aria-pressed", "true");
      } else {
        document.documentElement.removeAttribute("data-theme");
        icon.className = "bx bx-moon";
        btn.setAttribute("aria-pressed", "false");
      }
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        /* ignore */
      }
    }

    let saved = null;
    try {
      saved = localStorage.getItem("theme");
    } catch (e) {
      /* ignore */
    }
    if (saved === "light" || saved === "dark") {
      setTheme(saved === "light" ? "light" : "dark");
    } else {
      const prefersLight =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches;
      setTheme(prefersLight ? "light" : "dark");
    }

    btn.addEventListener("click", function () {
      const isLight =
        document.documentElement.getAttribute("data-theme") === "light";
      setTheme(isLight ? "dark" : "light");
    });

    const ref = header.querySelector(".menu-toggle");
    header.insertBefore(btn, ref ? ref.nextSibling : header.firstChild);
  }

  // Toggle contact section visibility
  function initContactToggle() {
    const section = document.getElementById("contact-section");
    if (!section) return;

    // Check if URL hash is #contact-section on load to reveal hidden section
    if (window.location.hash === "#contact-section") {
      section.style.display = "block";
      setTimeout(() => section.scrollIntoView({ behavior: "smooth" }), 100);
    }

    const triggers = document.querySelectorAll(
      'a[href="#contact-section"], #show-contact-btn'
    );
    triggers.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        section.style.display = "block";
        section.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // Handle contact form submission via AJAX (no page reload)
  function initFormSubmission() {
    const form = document.querySelector(".contact-form");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerText;

      // Check if the user forgot to add their Formspree ID
      if (form.action.includes("YOUR_FORM_ID")) {
        alert(
          "Please update the form action in about.html with your actual Formspree ID."
        );
        return;
      }

      btn.disabled = true;
      btn.innerText = "Sending...";

      try {
        const response = await fetch(form.action, {
          method: form.method,
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          form.reset();
          alert("Thanks for your message! I will get back to you soon.");
        } else {
          alert("Oops! There was a problem sending your message.");
        }
      } catch (error) {
        alert("Oops! There was a problem sending your message.");
      } finally {
        btn.disabled = false;
        btn.innerText = originalText;
      }
    });
  }

  // Init all features
  function init() {
    injectHelpers();
    initMobileMenu();
    initThemeToggle();
    initSmoothScroll();
    initRevealOnScroll();
    initExternalLinks();
    initContactToggle();
    initFormSubmission();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
