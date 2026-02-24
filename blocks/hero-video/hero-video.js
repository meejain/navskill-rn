/**
 * Hero Video Block
 * Full-width hero with background video and text overlay.
 *
 * Content model:
 * Row 1: Fallback image (picture element)
 * Row 2: Video URL (rendered as link by EDS)
 * Row 3: Overlay text
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Row 1: fallback image
  const pictureRow = rows[0];
  const picture = pictureRow?.querySelector('picture');

  // Row 2: video URL (may be a link or plain text)
  const videoRow = rows[1];
  const videoLink = videoRow?.querySelector('a');
  let videoUrl = videoLink?.href || '';
  if (!videoUrl) {
    const text = videoRow?.textContent?.trim() || '';
    if (text.match(/^https?:\/\/.*\.(mp4|webm|ogg)/i)) {
      videoUrl = text;
    }
  }

  // Row 3: overlay text
  const textRow = rows[2];
  const overlayText = textRow?.textContent?.trim() || '';

  // Clear block content
  block.textContent = '';

  // Create media container
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'hero-video-media';

  // Add video if URL provided
  if (videoUrl) {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const source = document.createElement('source');
    source.src = videoUrl;
    source.type = 'video/mp4';
    video.append(source);

    // Add fallback image as poster
    const img = picture?.querySelector('img');
    if (img) {
      video.poster = img.src;
    }

    mediaContainer.append(video);
  }

  // Add fallback picture (shown when video not supported or loading)
  if (picture) {
    mediaContainer.append(picture);
  }

  block.append(mediaContainer);

  // Create overlay
  if (overlayText) {
    const overlay = document.createElement('div');
    overlay.className = 'hero-video-overlay';
    const heading = document.createElement('p');
    heading.textContent = overlayText;
    overlay.append(heading);
    block.append(overlay);
  }
}
