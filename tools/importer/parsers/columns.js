/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns block
 *
 * Source: https://www.royalnavy.mod.uk/careers
 * Base Block: columns
 *
 * Block Structure (from markdown example):
 * - Row 1: column1 content | column2 content
 *
 * Source HTML Patterns:
 *
 * Pattern 1 - Quote with image (GridContainerDoubleImages):
 * <div class="GridContainerDoubleImages_gridRowDoubleImages__...">
 *   <div class="...gridRowDoubleImagesItem__...">
 *     <div class="MediaImage_mediaImage__..."><img></div>
 *   </div>
 *   <div class="...gridRowDoubleImagesItem__...">
 *     <div class="QuoteBlock_quoteBlock__...">
 *       <blockquote>Quote text</blockquote>
 *     </div>
 *     <div class="QuoteBlock_authorBlock__..."><p>Name</p><p>Role</p></div>
 *   </div>
 * </div>
 *
 * Pattern 2 - Pay & Benefits (OffsetMediaSide):
 * <div class="OffsetMediaSide_content__...">
 *   <div class="OffsetMediaSideItem_item__...">
 *     <div class="OffsetMediaSideItem_media__..."><img></div>
 *     <div class="OffsetMediaSideItem_content__...">
 *       <article><p>Text</p><ul>...</ul><a>CTA</a></article>
 *     </div>
 *   </div>
 * </div>
 *
 * Pattern 3 - CTA grid (GridContainerDouble):
 * <div class="GridContainerDouble_gridMiddleBottom__...">
 *   <div class="GridContainerDouble_gridRowDouble__...">
 *     <div class="...gridRowDoubleItem__...">
 *       <article><h2>Title</h2><p>Text</p><a>CTA</a></article>
 *     </div>
 *     <div class="...gridRowDoubleItem__...">
 *       <article><h2>Title</h2><p>Text</p></article>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-02-24
 */
export default function parse(element, { document }) {
  const cells = [];

  // Pattern 1: Quote with image (two grid items side by side)
  const gridItems = element.querySelectorAll('[class*="gridRowDoubleImagesItem"]');
  if (gridItems.length === 2) {
    const col1 = gridItems[0];
    const col2 = gridItems[1];

    // Column 1: Image
    const img = col1.querySelector('img');

    // Column 2: Quote + attribution
    const quoteEl = col2.querySelector('blockquote, [class*="QuoteBlock_quoteBlock"] blockquote');
    const authorEls = col2.querySelectorAll('[class*="QuoteBlock_authorBlock"] p, [class*="authorText"]');

    const contentCell = document.createElement('div');
    if (quoteEl) {
      const bq = document.createElement('blockquote');
      bq.textContent = quoteEl.textContent.trim();
      contentCell.appendChild(bq);
    }
    if (authorEls.length > 0) {
      const em = document.createElement('em');
      const authorTexts = Array.from(authorEls).map((a) => a.textContent.trim());
      em.textContent = authorTexts.join(', ');
      contentCell.appendChild(em);
    }

    cells.push([img || '', contentCell]);
  }

  // Pattern 2: Offset media with text content
  if (cells.length === 0) {
    const mediaItem = element.querySelector('[class*="OffsetMediaSideItem_item"]');
    if (mediaItem) {
      const img = mediaItem.querySelector('[class*="media"] img, [class*="MediaImage"] img, img');
      const contentEl = mediaItem.querySelector('[class*="OffsetMediaSideItem_content"], article');

      if (contentEl) {
        // Clone the content to preserve all rich HTML (lists, links, etc.)
        const contentClone = contentEl.cloneNode(true);
        cells.push([img || '', contentClone]);
      }
    }
  }

  // Pattern 3: CTA grid (two items side by side)
  if (cells.length === 0) {
    const rowItems = element.querySelectorAll('[class*="gridRowDoubleItem"], [class*="GridContainerDouble_gridRowDouble"] > div');
    if (rowItems.length >= 2) {
      const col1Content = document.createElement('div');
      const col2Content = document.createElement('div');

      // Column 1
      const title1 = rowItems[0].querySelector('h2, [class*="TextBlock_title"]');
      const text1 = rowItems[0].querySelector('[class*="TextBlock_text"] p, p');
      const cta1 = rowItems[0].querySelector('a[class*="Button"], a[class*="TextBlock_cta"]');

      if (title1) {
        const strong = document.createElement('strong');
        strong.textContent = title1.textContent.trim();
        col1Content.appendChild(strong);
      }
      if (text1) {
        const p = document.createElement('p');
        p.textContent = text1.textContent.trim();
        col1Content.appendChild(p);
      }
      if (cta1) {
        const link = document.createElement('a');
        link.href = cta1.href;
        link.textContent = cta1.querySelector('[class*="Button_text"]')
          ? cta1.querySelector('[class*="Button_text"]').textContent.trim()
          : cta1.textContent.trim();
        const p = document.createElement('p');
        p.appendChild(link);
        col1Content.appendChild(p);
      }

      // Column 2
      const title2 = rowItems[1].querySelector('h2, [class*="TextBlock_title"]');
      const text2 = rowItems[1].querySelector('[class*="TextBlock_text"] p, p');

      if (title2) {
        const strong = document.createElement('strong');
        strong.textContent = title2.textContent.trim();
        col2Content.appendChild(strong);
      }
      if (text2) {
        const p = document.createElement('p');
        p.textContent = text2.textContent.trim();
        col2Content.appendChild(p);
      }

      cells.push([col1Content, col2Content]);
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns', cells });
  element.replaceWith(block);
}
