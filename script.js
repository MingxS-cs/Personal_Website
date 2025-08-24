/*
 * script.js – handles language toggling and optional scroll navigation.
 *
 * Each textual element on the page carries data-en and data-zh attributes
 * which contain its English and Chinese versions respectively. When the
 * language toggle button is clicked, the script swaps the text
 * accordingly. The choice is persisted in localStorage so that a
 * visitor’s preference is remembered across page loads.
 */

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('lang-toggle');
  if (!toggleBtn) return;

  // Determine the initial language. Use localStorage if available.
  let currentLang = localStorage.getItem('lang') || 'en';

  /**
   * Update the text content of all elements that carry data-en and
   * data-zh attributes. This function also updates the label on the
   * language toggle button itself.
   *
   * @param {string} lang - Either 'en' or 'zh'.
   */
  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    // Update the toggle button label. When the current language is
    // English we offer Chinese and vice versa.
    toggleBtn.textContent = lang === 'en' ? '中文' : 'English';
    // Find all elements with data-en attribute (assumes that if
    // data-en exists then data-zh also exists).
    const translatables = document.querySelectorAll('[data-en]');
    translatables.forEach(el => {
      const translation = el.dataset[lang];
      if (translation !== undefined) {
        // For links, spans and headings we replace the textContent.
        // For form inputs you could set placeholder or value; our
        // portfolio doesn’t currently include input fields, but this
        // logic is prepared for future expansion.
        if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update the CV link path depending on language
    const cvLink = document.querySelector('.cv-link');
    if (cvLink) {
      if (lang === 'zh') {
        cvLink.setAttribute('href', 'assets/drive_assets/CV_ZH.pdf');
      } else {
        cvLink.setAttribute('href', 'assets/drive_assets/CV_EN.pdf');
      }
    }
    // Save preference
    localStorage.setItem('lang', lang);
  }

  // Attach toggle click handler.
  toggleBtn.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'zh' : 'en';
    setLanguage(nextLang);
  });

  // Set the language on initial load.
  setLanguage(currentLang);

  /* Optional: Scroll spy to highlight active navigation links.
   * This section registers an event listener on window scroll and
   * updates the active class of navigation links as the user scrolls
   * through the sections. If there are no nav links or sections on
   * the page, the code gracefully does nothing.
   */
  const navLinks = document.querySelectorAll('nav .nav-links a[href^="#"]');
  const sections = [];
  navLinks.forEach(link => {
    const id = link.getAttribute('href').substring(1);
    const section = document.getElementById(id);
    if (section) sections.push({ link, section });
  });
  function onScroll() {
    const scrollPos = window.scrollY + 70; // offset for fixed header
    sections.forEach(({ link, section }) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  if (sections.length > 0) {
    window.addEventListener('scroll', onScroll);
    // Invoke once on load to highlight the correct section.
    onScroll();
  }

  /*
   * Intersection observer for reveal animations. Elements with the
   * `.reveal` class will fade and slide into view when they enter
   * the viewport. To use this effect, assign the `.reveal` class
   * to any element in your HTML. The observer will append `.show`
   * when the element becomes visible.
   */
  const revealElements = document.querySelectorAll('.reveal, .project-card, .timeline .edu-item, .achievements-list li, .project-section, .contact-list li');
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );
  revealElements.forEach(el => {
    // ensure the base reveal class is applied so initial opacity is 0
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  /*
   * Parallax effect for hero backgrounds. Adjusts the background
   * position of hero sections slightly as the user scrolls to give
   * a sense of depth. Applies to both the home page hero and
   * project detail hero sections.
   */
  const heroSections = document.querySelectorAll('.hero, .project-hero');
  function updateParallax() {
    const scrollY = window.scrollY;
    heroSections.forEach(section => {
      // Move background image at half the scroll speed
      section.style.backgroundPositionY = `${scrollY * 0.5}px`;
    });
  }
  window.addEventListener('scroll', updateParallax);
  // Trigger once so that on load the hero backgrounds are positioned
  updateParallax();
});