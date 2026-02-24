/* eslint-disable */
/* global WebImporter */

/**
 * Transformer for Royal Navy website cleanup
 * Purpose: Remove non-content elements, cookie banners, chat widgets, and navigation
 * Applies to: www.royalnavy.mod.uk (all templates)
 * Generated: 2026-02-24
 *
 * SELECTORS EXTRACTED FROM:
 * - Captured DOM during migration of https://www.royalnavy.mod.uk/careers
 * - Playwright snapshot analysis of live page
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove cookie consent dialog
    // EXTRACTED: Found <div role="region" aria-label="Cookie preferences"> in captured DOM
    const cookieRegion = element.querySelector('[aria-label="Cookie preferences"]');
    if (cookieRegion) cookieRegion.remove();

    // Remove chat widget button
    // EXTRACTED: Found <button> with "Chat Now" text and chatbot integration
    const chatButton = element.querySelector('button[class*="Chat"]');
    if (chatButton) chatButton.remove();

    // Remove main navigation overlay
    // EXTRACTED: Found <nav aria-label="Main navigation"> as overlay menu
    const mainNav = element.querySelector('nav[aria-label="Main navigation"]');
    if (mainNav) mainNav.remove();

    // Remove header/banner navigation
    // EXTRACTED: Found <header> element with logo and nav toggle
    const header = element.querySelector('header, [class*="Header_header"]');
    if (header) header.remove();

    // Remove footer
    // EXTRACTED: Found <footer> with social links, contact info, useful links
    const footer = element.querySelector('footer, [role="contentinfo"]');
    if (footer) footer.remove();

    // Remove skip to content link
    // EXTRACTED: Found <a href="#main">Skip to content</a>
    const skipLink = element.querySelector('a[href="#main"]');
    if (skipLink) skipLink.remove();

    // Remove decorative orb elements (animated background circles)
    // EXTRACTED: Found <div class="Orb_orb__XF53a"> with SVG placeholder images
    const orbs = element.querySelectorAll('[class*="Orb_orb"]');
    orbs.forEach((orb) => orb.remove());

    // Remove breadcrumb navigation elements
    // EXTRACTED: Found <nav aria-label="Breadcrumb"> within sections
    const breadcrumbs = element.querySelectorAll('nav[aria-label="Breadcrumb"]');
    breadcrumbs.forEach((bc) => bc.remove());

    // Remove section arrow/scroll buttons
    // EXTRACTED: Found <button aria-label="Next section"> with SVG arrows
    const sectionArrows = element.querySelectorAll('[class*="SectionArrow"], button[aria-label="Next section"]');
    sectionArrows.forEach((arrow) => arrow.remove());

    // Remove keyline decorative elements
    // EXTRACTED: Found <div class="Keylines_keylineHorizontal__..."> decorative dividers
    const keylines = element.querySelectorAll('[class*="Keylines_keyline"], [class*="keylineStart"], [class*="keylineEnd"], [class*="keylineMiddle"]');
    keylines.forEach((kl) => kl.remove());

    // Remove section border decorative elements
    // EXTRACTED: Found <span class="SectionWrapper_leftBorder__..."> border spans
    const borders = element.querySelectorAll('[class*="SectionWrapper_border"], [class*="leftBorder"], [class*="rightBorder"]');
    borders.forEach((b) => b.remove());

    // Remove carousel navigation buttons (Previous/Next)
    // EXTRACTED: Found <div class="Carousel_nav__..."> with prev/next buttons
    const carouselNavs = element.querySelectorAll('[class*="Carousel_nav"]');
    carouselNavs.forEach((nav) => nav.remove());

    // Remove video elements (not importable as content)
    // EXTRACTED: Found <video class="CoverVideo_video__..."> autoplay loop
    const videos = element.querySelectorAll('video');
    videos.forEach((v) => v.remove());

    // Remove alert region
    // EXTRACTED: Found <div role="alert"> empty alert container
    const alerts = element.querySelectorAll('[role="alert"]');
    alerts.forEach((a) => a.remove());
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove any remaining iframes, noscript, link tags
    WebImporter.DOMUtils.remove(element, [
      'iframe',
      'link',
      'noscript',
      'source',
    ]);

    // Remove inline SVGs that were used for icons/arrows
    const svgs = element.querySelectorAll('svg');
    svgs.forEach((svg) => {
      // Only remove if not inside a meaningful content context
      if (!svg.closest('a') && !svg.closest('button')) {
        svg.remove();
      }
    });
  }
}
