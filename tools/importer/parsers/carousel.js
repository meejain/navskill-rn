/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: carousel
 *
 * Block Structure (from markdown example):
 * - Row N: image | title + description (per slide)
 *
 * Source HTML Pattern:
 * <div class="CarouselSection_carouselSection__..." data-carousel-type="video">
 *   <div class="Carousel_carouselItems__...">
 *     <div class="Carousel_item__...">
 *       <div class="CarouselItem_carouselItem__...">
 *         <div class="CarouselVideoThumbnail_videoThumbnail__...">
 *           <img alt="..." src="...">
 *         </div>
 *         <div class="CarouselItem_content__...">
 *           <h3>Title</h3>
 *           <div class="CarouselItem_text__..."><p>Description</p></div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  // Find all carousel items
  // VALIDATED: Found <div class="Carousel_item__..."> containing each slide
  const items = element.querySelectorAll('[class*="Carousel_item__"], [class*="CarouselItem_carouselItem"]');

  const cells = [];

  // If no items found via class, try structural approach
  const slideElements = items.length > 0
    ? items
    : element.querySelectorAll('[class*="carouselItems"] > div');

  slideElements.forEach((item) => {
    // Extract image from slide
    // VALIDATED: Found <img> inside CarouselVideoThumbnail or CarouselItem_imageContainer
    const img = item.querySelector('[class*="Thumbnail"] img, [class*="imageContainer"] img, img');

    // Extract title
    // VALIDATED: Found <h3 class="CarouselItem_title__...">
    const title = item.querySelector('h3, [class*="CarouselItem_title"]');

    // Extract description text
    // VALIDATED: Found <div class="CarouselItem_text__..."><p>...</p></div>
    const textEl = item.querySelector('[class*="CarouselItem_text"], [class*="content"] p');

    // Build content cell with title and description
    const contentCell = document.createElement('div');
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = title.textContent.trim();
      contentCell.appendChild(strong);
      contentCell.appendChild(document.createTextNode(' '));
    }
    if (textEl) {
      contentCell.appendChild(document.createTextNode(textEl.textContent.trim()));
    }

    // Row: image | content
    if (img) {
      cells.push([img, contentCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel', cells });
  element.replaceWith(block);
}
