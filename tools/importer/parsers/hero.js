/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: hero
 *
 * Block Structure (from markdown example):
 * - Row 1: Background image
 * - Row 2: Heading/title text
 *
 * Source HTML Pattern:
 * <div class="IntroMedia_bgImageWrapper__...">
 *   <div class="IntroMedia_bgImage__...">
 *     <img alt="..." srcset="..." src="...">
 *     <video>...</video>
 *   </div>
 * </div>
 * + associated banner content with title text
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  // Extract background image
  // VALIDATED: Found <img> inside IntroMedia_bgImage with srcset and src
  const bgImage = element.querySelector('[class*="CoverImage_image"], [class*="bgImage"] img, img');

  // Extract banner title text
  // VALIDATED: Found <div class="IntroMedia_bannerTitle__...">Made in the royal navy</div>
  // The title is in a sibling section, so we look in the broader context
  const parentSection = element.closest('section') || element.closest('[data-role-page]');
  const bannerTitle = parentSection
    ? parentSection.querySelector('[class*="bannerTitle"], [class*="IntroMedia_bannerContent"] div[class*="bannerTitle"]')
    : null;

  // Build cells array matching Hero block structure
  const cells = [];

  // Row 1: Background image
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 2: Title text
  if (bannerTitle) {
    cells.push([bannerTitle.textContent.trim()]);
  } else {
    // Fallback: look for any heading or prominent text
    const heading = element.querySelector('h1, h2, [class*="headline"]');
    if (heading) {
      cells.push([heading.textContent.trim()]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero', cells });
  element.replaceWith(block);
}
