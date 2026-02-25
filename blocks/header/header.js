import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const MOBILE_BREAKPOINT = '(min-width: 900px)';

function createArrowSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M9 5l7 7-7 7');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  svg.append(path);
  return svg;
}

function createBackArrowSvg() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M15 19l-7-7 7-7');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.5');
  svg.append(path);
  return svg;
}

function closeAllPanelsIn(panelEl) {
  const navPanelEl = panelEl.closest('.nav-panel');
  if (!navPanelEl) return;
  navPanelEl.querySelectorAll('.nav-sub-panel.is-active').forEach((p) => {
    p.classList.remove('is-active');
  });
  navPanelEl.querySelectorAll('[aria-expanded="true"]').forEach((btn) => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

function buildSubPanel(items, parentLabel, onBack, topParentLabel) {
  const panel = document.createElement('div');
  panel.className = 'nav-sub-panel';

  // Top-level back button — goes directly to main menu (only for nested panels)
  if (topParentLabel) {
    const topBackBtn = document.createElement('button');
    topBackBtn.className = 'nav-back-btn nav-back-top';
    topBackBtn.setAttribute('aria-label', `Back to ${topParentLabel}`);
    topBackBtn.append(createBackArrowSvg());
    const topBackLabel = document.createElement('span');
    topBackLabel.textContent = topParentLabel;
    topBackBtn.append(topBackLabel);
    topBackBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllPanelsIn(panel);
    });
    panel.append(topBackBtn);
  }

  // Immediate parent back button — goes back one level
  const backBtn = document.createElement('button');
  backBtn.className = 'nav-back-btn';
  backBtn.setAttribute('aria-label', `Back to ${parentLabel}`);
  backBtn.append(createBackArrowSvg());
  const backLabel = document.createElement('span');
  backLabel.textContent = parentLabel;
  backBtn.append(backLabel);
  backBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.remove('is-active');
    if (onBack) onBack();
  });

  const heading = document.createElement('div');
  heading.className = 'nav-sub-heading';

  const separator = document.createElement('div');
  separator.className = 'nav-sub-separator';

  const list = document.createElement('ul');
  list.className = 'nav-sub-items';

  panel.append(backBtn, heading, separator, list);
  return { panel, list, heading };
}

function getDirectLink(li) {
  return li.querySelector(':scope > a') || li.querySelector(':scope > p > a');
}

function processNavItems(ul, container) {
  const items = ul.querySelectorAll(':scope > li');

  items.forEach((item) => {
    const link = getDirectLink(item);
    const subUl = item.querySelector(':scope > ul');

    if (!link) return;

    const text = link.textContent.trim();
    const href = link.getAttribute('href');

    // Check if this is a CTA item (Careers section)
    const isCta = text === 'Find a role' || text === 'Start your application';

    if (subUl) {
      // Item with sub-menu
      const wrapper = document.createElement('div');
      wrapper.className = 'nav-item-wrapper';

      const trigger = document.createElement('button');
      trigger.className = 'nav-item-trigger';
      trigger.setAttribute('aria-expanded', 'false');

      const label = document.createElement('span');
      label.className = 'nav-item-label';
      label.textContent = text;

      trigger.append(label, createArrowSvg());

      const { panel, list: subList, heading } = buildSubPanel(
        null,
        text,
        () => { trigger.setAttribute('aria-expanded', 'false'); },
      );

      heading.textContent = text;

      // Add overview link
      const overviewLi = document.createElement('li');
      const overviewA = document.createElement('a');
      overviewA.href = href;
      overviewA.textContent = text;
      overviewA.className = 'nav-overview-link';
      overviewLi.append(overviewA);
      subList.append(overviewLi);

      // Process sub-items recursively
      const subItems = subUl.querySelectorAll(':scope > li');
      subItems.forEach((subItem) => {
        const subLink = getDirectLink(subItem);
        const nestedUl = subItem.querySelector(':scope > ul');

        if (!subLink) return;

        const subText = subLink.textContent.trim();
        const subHref = subLink.getAttribute('href');
        const isSubCta = subText === 'Find a role' || subText === 'Start your application';

        if (nestedUl) {
          // Nested sub-menu (level 3)
          const nestedWrapper = document.createElement('div');
          nestedWrapper.className = 'nav-item-wrapper';

          const nestedTrigger = document.createElement('button');
          nestedTrigger.className = 'nav-item-trigger';
          nestedTrigger.setAttribute('aria-expanded', 'false');

          const nestedLabel = document.createElement('span');
          nestedLabel.className = 'nav-item-label';
          nestedLabel.textContent = subText;

          nestedTrigger.append(nestedLabel, createArrowSvg());

          const {
            panel: nestedPanel, list: nestedList,
          } = buildSubPanel(
            null,
            subText,
            () => { nestedTrigger.setAttribute('aria-expanded', 'false'); },
            text,
          );

          // Add overview link for nested
          const nestedOverviewLi = document.createElement('li');
          const nestedOverviewA = document.createElement('a');
          nestedOverviewA.href = subHref;
          nestedOverviewA.textContent = subText;
          nestedOverviewA.className = 'nav-overview-link';
          nestedOverviewLi.append(nestedOverviewA);
          nestedList.append(nestedOverviewLi);

          // Process leaf items
          nestedUl.querySelectorAll(':scope > li').forEach((leafItem) => {
            const leafLink = leafItem.querySelector(':scope > a');
            if (leafLink) {
              const leafLi = document.createElement('li');
              const leafA = document.createElement('a');
              leafA.href = leafLink.getAttribute('href');
              leafA.textContent = leafLink.textContent.trim();
              leafLi.append(leafA);
              nestedList.append(leafLi);
            }
          });

          nestedTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            nestedPanel.classList.add('is-active');
            nestedTrigger.setAttribute('aria-expanded', 'true');
          });

          const nestedLi = document.createElement('li');
          nestedWrapper.append(nestedTrigger, nestedPanel);
          nestedLi.append(nestedWrapper);
          subList.append(nestedLi);
        } else if (isSubCta) {
          // CTA button — append after list
          const ctaLink = document.createElement('a');
          ctaLink.href = subHref;
          ctaLink.className = 'nav-cta-button';
          const ctaSpan = document.createElement('span');
          ctaSpan.textContent = subText;
          ctaLink.append(ctaSpan, createArrowSvg());
          panel.append(ctaLink);
        } else {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = subHref;
          a.textContent = subText;
          li.append(a);
          subList.append(li);
        }
      });

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.add('is-active');
        trigger.setAttribute('aria-expanded', 'true');
      });

      wrapper.append(trigger, panel);
      container.append(wrapper);
    } else if (isCta) {
      // CTA button at top level
      const ctaLink = document.createElement('a');
      ctaLink.href = href;
      ctaLink.className = 'nav-cta-button';
      const ctaSpan = document.createElement('span');
      ctaSpan.textContent = text;
      ctaLink.append(ctaSpan, createArrowSvg());
      container.append(ctaLink);
    } else {
      // Simple link
      const linkWrapper = document.createElement('div');
      linkWrapper.className = 'nav-item-link';
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      linkWrapper.append(a);
      container.append(linkWrapper);
    }
  });
}

function closeAllPanels(navPanelRef) {
  navPanelRef.querySelectorAll('.nav-sub-panel.is-active').forEach((p) => {
    p.classList.remove('is-active');
  });
  navPanelRef.querySelectorAll('[aria-expanded="true"]').forEach((btn) => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  if (fragment) {
    while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
  }

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Header wrapper
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'header-inner';

  // Banner (from nav-tools section)
  const navTools = nav.querySelector('.nav-tools');
  const bannerDiv = document.createElement('div');
  bannerDiv.className = 'nav-banner';
  if (navTools) {
    const toolsText = navTools.textContent.trim();
    const toolsLink = navTools.querySelector('a');
    if (toolsText && toolsLink) {
      const marker = document.createElement('span');
      marker.className = 'banner-marker';
      const preText = toolsText.replace(toolsLink.textContent.trim(), '').trim();
      const textSpan = document.createElement('span');
      textSpan.className = 'banner-text';
      textSpan.textContent = preText;
      const linkEl = document.createElement('a');
      linkEl.href = toolsLink.href;
      linkEl.className = 'banner-link';
      linkEl.textContent = toolsLink.textContent.trim();
      bannerDiv.append(marker, textSpan, linkEl);
    }
  }

  // Logo (from nav-brand section)
  const navBrand = nav.querySelector('.nav-brand');
  const logoDiv = document.createElement('a');
  logoDiv.className = 'nav-logo';
  logoDiv.href = '/';
  logoDiv.setAttribute('aria-label', 'Royal Navy Home');
  if (navBrand) {
    const img = navBrand.querySelector('img');
    if (img) {
      const logoImg = img.cloneNode(true);
      logoDiv.append(logoImg);
    }
  }

  // Hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Open Main Navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-controls', 'nav-panel');
  hamburger.innerHTML = `<span class="hamburger-lines">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
  </span>`;

  headerWrapper.append(logoDiv, hamburger);

  // Off-canvas nav panel
  const navPanel = document.createElement('div');
  navPanel.className = 'nav-panel';
  navPanel.id = 'nav-panel';
  navPanel.setAttribute('aria-label', 'Main navigation');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'nav-close';
  closeBtn.setAttribute('aria-label', 'Close navigation');
  closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5"/>
  </svg>`;

  // Build nav content
  const navContent = document.createElement('div');
  navContent.className = 'nav-content';

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    const navUl = navSections.querySelector('ul');
    if (navUl) {
      processNavItems(navUl, navContent);
    }
  }

  navPanel.append(closeBtn, navContent);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';

  // Assemble block
  block.textContent = '';
  block.append(bannerDiv, headerWrapper, navPanel, overlay);

  // Open / Close handlers
  const openNav = () => {
    navPanel.classList.add('is-open');
    overlay.classList.add('is-visible');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  };

  const closeNav = () => {
    navPanel.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    setTimeout(() => closeAllPanels(navPanel), 500);
  };

  hamburger.addEventListener('click', openNav);
  closeBtn.addEventListener('click', closeNav);
  overlay.addEventListener('click', closeNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navPanel.classList.contains('is-open')) {
      closeNav();
    }
  });

  // Viewport resize handling
  const mql = window.matchMedia(MOBILE_BREAKPOINT);
  mql.addEventListener('change', () => {
    if (navPanel.classList.contains('is-open')) {
      closeNav();
    }
  });
}
