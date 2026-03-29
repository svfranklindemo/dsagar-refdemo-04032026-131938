import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const BLOCK_OPTION_NAMES = new Set([
  'slideheight',
  'overlaytheme',
  'autoplay',
  'autoplayinterval',
  'showcontrols',
  'showpagination',
]);

const BLOCK_DEFAULTS = {
  slideheight: 'large',
  overlaytheme: 'light',
  autoplay: 'true',
  autoplayinterval: '5000',
  showcontrols: 'true',
  showpagination: 'true',
};

const SLIDE_DEFAULTS = {
  contentPosition: 'left',
};

function findDirectChild(root, node) {
  let current = node;
  while (current && current.parentElement !== root) {
    current = current.parentElement;
  }
  return current?.parentElement === root ? current : null;
}

function readNodeValue(node) {
  if (!node) return '';

  const link = node.querySelector('a[href]');
  if (link) return link.getAttribute('href') || link.href || '';

  const image = node.querySelector('picture img, img');
  if (image) return image.getAttribute('src') || image.src || '';

  return node.textContent.trim();
}

function isTrue(value) {
  return `${value}`.toLowerCase() !== 'false';
}

function clampInterval(value) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return 5000;
  return Math.min(Math.max(parsed, 2000), 20000);
}

function normalizePosition(value) {
  const normalized = toClassName(value || '');
  if (['left', 'center', 'right'].includes(normalized)) return normalized;
  return SLIDE_DEFAULTS.contentPosition;
}

function extractBlockOptions(block) {
  const options = { ...BLOCK_DEFAULTS };
  const rowsToRemove = new Set();

  [...block.children].forEach((row) => {
    const propNode = row.querySelector('[data-aue-prop]');
    const propName = propNode?.getAttribute('data-aue-prop');

    if (BLOCK_OPTION_NAMES.has(propName)) {
      options[propName] = readNodeValue(row);
      rowsToRemove.add(row);
      return;
    }

    if (row.children.length === 2 && !row.querySelector('picture')) {
      const key = toClassName(row.children[0].textContent || '');
      if (BLOCK_OPTION_NAMES.has(key)) {
        options[key] = readNodeValue(row.children[1]);
        rowsToRemove.add(row);
      }
    }
  });

  rowsToRemove.forEach((row) => row.remove());

  return {
    slideheight: toClassName(options.slideheight || BLOCK_DEFAULTS.slideheight) || BLOCK_DEFAULTS.slideheight,
    overlaytheme: toClassName(options.overlaytheme || BLOCK_DEFAULTS.overlaytheme) || BLOCK_DEFAULTS.overlaytheme,
    autoplay: isTrue(options.autoplay),
    autoplayinterval: clampInterval(options.autoplayinterval),
    showcontrols: isTrue(options.showcontrols),
    showpagination: isTrue(options.showpagination),
  };
}

function getFieldCell(row, propName, index) {
  const propNode = row.querySelector(`[data-aue-prop="${propName}"]`);
  if (propNode) {
    return findDirectChild(row, propNode) || row.children[index];
  }
  return row.children[index];
}

function hasVisibleContent(element) {
  return !!element && !!element.textContent.trim();
}

function optimizeSlideImage(mediaCell, altText, eager = false) {
  const image = mediaCell.querySelector('picture img, img');
  if (!image) return;

  const picture = image.closest('picture');
  const optimizedPicture = createOptimizedPicture(
    image.currentSrc || image.src,
    altText || image.alt || '',
    eager,
    [{ width: '2000' }],
  );

  const optimizedImage = optimizedPicture.querySelector('img');
  if (eager) {
    optimizedImage.loading = 'eager';
    optimizedImage.setAttribute('fetchpriority', 'high');
  }

  moveInstrumentation(image, optimizedImage);

  if (picture) {
    picture.replaceWith(optimizedPicture);
  } else {
    mediaCell.prepend(optimizedPicture);
    image.remove();
  }
}

function buildControl(direction) {
  const button = document.createElement('button');
  button.className = `image-slider-control image-slider-control-${direction}`;
  button.type = 'button';
  button.setAttribute('aria-label', direction === 'prev' ? 'Previous slide' : 'Next slide');

  const icon = document.createElement('img');
  icon.src = `${window.hlx.codeBasePath}/icons/${direction}.svg`;
  icon.alt = '';
  icon.loading = 'lazy';
  button.append(icon);

  return button;
}

function buildSlide(row, index) {
  const slide = document.createElement('li');
  slide.className = 'image-slider-slide';
  slide.dataset.index = `${index}`;
  moveInstrumentation(row, slide);

  const mediaCell = getFieldCell(row, 'image', 0);
  const altCell = getFieldCell(row, 'imageAlt', 1) || getFieldCell(row, 'imagealt', 1);
  const contentCell = getFieldCell(row, 'content', 2);
  const positionCell = getFieldCell(row, 'contentPosition', 3)
    || getFieldCell(row, 'contentposition', 3);

  const slideImage = mediaCell?.querySelector('picture, img');
  if (!slideImage) return null;

  const altText = readNodeValue(altCell);
  const contentPosition = normalizePosition(readNodeValue(positionCell));

  mediaCell.className = 'image-slider-slide-media';
  optimizeSlideImage(mediaCell, altText, index === 0);

  slide.append(mediaCell);

  if (contentCell) {
    contentCell.className = `image-slider-slide-content image-slider-slide-content-${contentPosition}`;
    contentCell.querySelectorAll('a').forEach((link) => {
      link.classList.add('button');
    });

    if (!hasVisibleContent(contentCell)) {
      contentCell.remove();
      slide.classList.add('is-media-only');
    } else {
      slide.append(contentCell);
    }
  } else {
    slide.classList.add('is-media-only');
  }

  return slide;
}

function setSlideState(slides, activeIndex) {
  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
    slide.querySelectorAll('a, button').forEach((element) => {
      if (isActive) {
        element.removeAttribute('tabindex');
      } else {
        element.setAttribute('tabindex', '-1');
      }
    });
  });
}

export default function decorate(block) {
  const settings = extractBlockOptions(block);
  let authoredRows = [...block.children].filter((row) => row.children.length);
  authoredRows = authoredRows.filter((row) => row.querySelector('picture'));

  const slides = authoredRows
    .map((row, index) => buildSlide(row, index))
    .filter(Boolean);

  block.textContent = '';

  if (!slides.length) return;

  block.classList.add(`image-slider-height-${settings.slideheight}`);
  block.classList.add(`image-slider-theme-${settings.overlaytheme}`);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Promotional image slider');

  const viewport = document.createElement('div');
  viewport.className = 'image-slider-viewport';
  viewport.tabIndex = 0;
  viewport.setAttribute('aria-live', settings.autoplay ? 'off' : 'polite');

  const track = document.createElement('ul');
  track.className = 'image-slider-track';
  slides.forEach((slide) => track.append(slide));
  viewport.append(track);
  block.append(viewport);

  const totalSlides = slides.length;
  let currentIndex = 0;
  let autoplayTimer;

  let prevButton;
  let nextButton;
  if (settings.showcontrols && totalSlides > 1) {
    prevButton = buildControl('prev');
    nextButton = buildControl('next');
    block.append(prevButton, nextButton);
  }

  let pagination;
  if (settings.showpagination && totalSlides > 1) {
    pagination = document.createElement('div');
    pagination.className = 'image-slider-pagination';
    pagination.setAttribute('role', 'tablist');
    pagination.setAttribute('aria-label', 'Choose a slide');

    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'image-slider-dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.dataset.index = `${index}`;
      pagination.append(dot);
    });

    block.append(pagination);
  }

  const updateSlider = (nextIndex) => {
    currentIndex = (nextIndex + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    setSlideState(slides, currentIndex);

    if (pagination) {
      [...pagination.children].forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });
    }
  };

  const stopAutoplay = () => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const startAutoplay = () => {
    if (!settings.autoplay || totalSlides < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    stopAutoplay();
    autoplayTimer = window.setInterval(() => {
      updateSlider(currentIndex + 1);
    }, settings.autoplayinterval);
  };

  prevButton?.addEventListener('click', () => {
    updateSlider(currentIndex - 1);
  });

  nextButton?.addEventListener('click', () => {
    updateSlider(currentIndex + 1);
  });

  pagination?.addEventListener('click', (event) => {
    const dot = event.target.closest('.image-slider-dot');
    if (!dot) return;
    updateSlider(parseInt(dot.dataset.index, 10));
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      updateSlider(currentIndex - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      updateSlider(currentIndex + 1);
    }
  });

  block.addEventListener('mouseenter', stopAutoplay);
  block.addEventListener('mouseleave', startAutoplay);
  block.addEventListener('focusin', stopAutoplay);
  block.addEventListener('focusout', (event) => {
    if (!block.contains(event.relatedTarget)) startAutoplay();
  });

  updateSlider(0);
  startAutoplay();
}
