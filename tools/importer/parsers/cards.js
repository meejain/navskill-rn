/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: cards
 *
 * Block Structure (from markdown example):
 * - Row N: image | title + description + optional link (per card)
 *
 * Source HTML Patterns:
 *
 * Pattern 1 - Profession carousel cards:
 * <div class="CarouselItem_carouselItem__..." data-carousel-type="content">
 *   <a href="..."><div class="CarouselItem_imageContainer__..."><img></div></a>
 *   <div class="CarouselItem_content__...">
 *     <h3><a href="...">Title</a></h3>
 *     <div class="CarouselItem_text__..."><p>Description</p></div>
 *   </div>
 *   <div class="CarouselItem_cta__..."><a aria-label="Read more" href="..."></a></div>
 * </div>
 *
 * Pattern 2 - Content blocks (Other ways to join):
 * <div class="ContentBlock_contentBlock__...">
 *   <div class="ContentBlock_contentImage__..."><img></div>
 *   <article><h2>Title</h2><div>Description</div><a href="..."></a></article>
 * </div>
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  const cells = [];

  // Pattern 1: Carousel-style cards (profession cards)
  const carouselItems = element.querySelectorAll('[class*="CarouselItem_carouselItem"], [class*="Carousel_item__"] > div');

  if (carouselItems.length > 0) {
    carouselItems.forEach((item) => {
      // Extract image
      // VALIDATED: Found <img> inside CarouselItem_imageContainer
      const img = item.querySelector('[class*="imageContainer"] img, img');

      // Extract title
      // VALIDATED: Found <h3> with link inside CarouselItem_content
      const titleEl = item.querySelector('h3 a, h3, [class*="CarouselItem_title"]');
      const title = titleEl ? titleEl.textContent.trim() : '';

      // Extract description
      // VALIDATED: Found <div class="CarouselItem_text__..."> or <p> inside content
      const descEl = item.querySelector('[class*="CarouselItem_text"] p, [class*="CarouselItem_text"]');
      const desc = descEl ? descEl.textContent.trim() : '';

      // Extract CTA link
      // VALIDATED: Found <a> inside CarouselItem_cta with aria-label="Read more"
      const ctaEl = item.querySelector('[class*="CarouselItem_cta"] a, a[aria-label="Read more"]');
      const linkHref = ctaEl ? ctaEl.href : (titleEl && titleEl.closest('a') ? titleEl.closest('a').href : '');

      // Build content cell
      const contentCell = document.createElement('div');
      if (title) {
        const strong = document.createElement('strong');
        strong.textContent = title;
        contentCell.appendChild(strong);
        contentCell.appendChild(document.createTextNode(' '));
      }
      if (desc) {
        contentCell.appendChild(document.createTextNode(desc + ' '));
      }
      if (linkHref) {
        const link = document.createElement('a');
        link.href = linkHref;
        link.textContent = 'Read more';
        contentCell.appendChild(link);
      }

      if (img) {
        cells.push([img, contentCell]);
      }
    });
  }

  // Pattern 2: Content block cards (RFA, Reserves)
  if (cells.length === 0) {
    const contentBlocks = element.querySelectorAll('[class*="ContentBlock_contentBlock"], [class*="gridRowDoubleImagesItem"]');

    contentBlocks.forEach((block) => {
      // Extract image
      // VALIDATED: Found <img> inside ContentBlock_contentImage or MediaImage
      const img = block.querySelector('[class*="contentImage"] img, [class*="MediaImage"] img, img');

      // Extract title
      // VALIDATED: Found <h2> inside TextBlock
      const titleEl = block.querySelector('h2, [class*="TextBlock_title"]');
      const title = titleEl ? titleEl.textContent.trim() : '';

      // Extract description
      // VALIDATED: Found <div class="TextBlock_text__..."> with description
      const descEl = block.querySelector('[class*="TextBlock_text"] div, [class*="TextBlock_text"]');
      const desc = descEl ? descEl.textContent.trim() : '';

      // Extract CTA link
      // VALIDATED: Found <a class="Button_textCircleButton__..."> CTA
      const ctaEl = block.querySelector('a[class*="Button_textCircleButton"], a[class*="TextBlock_cta"]');
      const linkHref = ctaEl ? ctaEl.href : '';

      // Build content cell
      const contentCell = document.createElement('div');
      if (title) {
        const strong = document.createElement('strong');
        strong.textContent = title;
        contentCell.appendChild(strong);
        contentCell.appendChild(document.createTextNode(' '));
      }
      if (desc) {
        contentCell.appendChild(document.createTextNode(desc + ' '));
      }
      if (linkHref) {
        const link = document.createElement('a');
        link.href = linkHref;
        link.textContent = 'Learn more';
        contentCell.appendChild(link);
      }

      if (img) {
        cells.push([img, contentCell]);
      }
    });
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards', cells });
  element.replaceWith(block);
}
