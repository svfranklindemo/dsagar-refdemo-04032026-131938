/**
 * DM Template Menu block: configuration UI that updates a Dynamic Media template image.
 * Uses the 1-to-1-template-square template and builds URL from menu state.
 */
const DEFAULT_TEMPLATE_BASE = 'https://s7d1.scene7.com/is/image/Viewers/1-to-1-template-square';
const DEFAULT_FONT = 'Proxima%20Nova%20Rg';

const DEFAULT_STATE = {
  language: 'en',
  productImage: 'Viewers/h6-lightpink',
  backgroundImage: 'Viewers/01',
  productTitle: 'AEM-1',
  price: '$ 399',
  headline: 'Dynamic range. Pure sound.',
  backgroundColor: '0xb5a59b',
};

const COLOR_SWATCHES = [
  { hex: '#b5a59b', value: '0xb5a59b' },
  { hex: '#2d2d2d', value: '0x2d2d2d' },
  { hex: '#9e9e9e', value: '0x9e9e9e' },
  { hex: '#6d4c41', value: '0x6d4c41' },
  { hex: '#00695c', value: '0x00695c' },
  { hex: '#e65100', value: '0xe65100' },
  { hex: '#bf360c', value: '0xbf360c' },
  { hex: '#fafafa', value: '0xfafafa' },
  { hex: '#558b2f', value: '0x558b2f' },
  { hex: '#212121', value: '0x212121' },
];

function buildTemplateUrl(state) {
  const params = new URLSearchParams();
  params.set('scl', '1');
  params.set('$background_texture', state.backgroundImage);
  params.set('$product', state.productImage);
  params.set('$background_color', state.backgroundColor);
  params.set('$product_title_font', DEFAULT_FONT);
  params.set('$price_font', DEFAULT_FONT);
  params.set('$headline_font', DEFAULT_FONT);
  params.set('$product_title', state.productTitle);
  params.set('$price', state.price.replace(/\s/g, ''));
  const headlineEncoded = state.headline.replace(/\n/g, ' \\par ').trim();
  params.set('$headline', headlineEncoded);
  var query = params.toString().replace("%24", '$')
  query = query.replace("%2F", '/')
  query = query.replace("%2520", '%20');
  query = query.replace("%24", '$');
  // const query = params.toString().replace(/\+/g, '%20');
  return `${DEFAULT_TEMPLATE_BASE}?${query}`;
}

function createSection(label, helpTitle, content) {
  const section = document.createElement('div');
  section.className = 'dm-template-menu-section';
  const header = document.createElement('div');
  header.className = 'dm-template-menu-section-header';
  header.textContent = label;
  if (helpTitle) {
    const help = document.createElement('span');
    help.className = 'dm-template-menu-help';
    help.title = helpTitle;
    help.setAttribute('aria-label', helpTitle);
    help.textContent = '?';
    header.appendChild(help);
  }
  section.appendChild(header);
  section.appendChild(content);
  return section;
}

function createInputGroup(label, inputEl, id, helpTitle) {
  const group = document.createElement('div');
  group.className = 'dm-template-menu-input-group';
  const header = document.createElement('div');
  header.className = 'dm-template-menu-section-header';
  header.textContent = label;
  if (helpTitle) {
    const help = document.createElement('span');
    help.className = 'dm-template-menu-help';
    help.title = helpTitle;
    help.setAttribute('aria-label', helpTitle);
    help.textContent = '?';
    header.appendChild(help);
  }
  group.appendChild(header);
  if (id) inputEl.id = id;
  group.appendChild(inputEl);
  return group;
}

export default async function decorate(block) {
  block.classList.add('dm-template-menu');
  block.innerHTML = '';

  let state = { ...DEFAULT_STATE };

  const menuPanel = document.createElement('div');
  menuPanel.className = 'dm-template-menu-panel';

  // Language / Region
  const langSelect = document.createElement('select');
  langSelect.className = 'dm-template-menu-select';
  langSelect.innerHTML = '<option value="en">English</option>';
  menuPanel.appendChild(createSection('LANGUAGE / REGION', 'Select language or region', langSelect));

  // Product Image / Background Image row
  const imageRow = document.createElement('div');
  imageRow.className = 'dm-template-menu-row';
  const productImageInput = document.createElement('input');
  productImageInput.type = 'text';
  productImageInput.className = 'dm-template-menu-input';
  productImageInput.placeholder = 'e.g. Viewers/h6-lightpink';
  productImageInput.value = state.productImage;
  const bgImageInput = document.createElement('input');
  bgImageInput.type = 'text';
  bgImageInput.className = 'dm-template-menu-input';
  bgImageInput.placeholder = 'e.g. Viewers/01';
  bgImageInput.value = state.backgroundImage;
  imageRow.appendChild(createInputGroup('PRODUCT IMAGE', productImageInput, 'dm-menu-product-image', 'Scene7 asset path for product image'));
  imageRow.appendChild(createInputGroup('BACKGROUND IMAGE', bgImageInput, 'dm-menu-background-image', 'Scene7 asset path for background'));
  menuPanel.appendChild(imageRow);

  // Product Title / Price row
  const titlePriceRow = document.createElement('div');
  titlePriceRow.className = 'dm-template-menu-row';
  const productTitleInput = document.createElement('input');
  productTitleInput.type = 'text';
  productTitleInput.className = 'dm-template-menu-input';
  productTitleInput.value = state.productTitle;
  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.className = 'dm-template-menu-input';
  priceInput.value = state.price;
  titlePriceRow.appendChild(createInputGroup('PRODUCT TITLE', productTitleInput, 'dm-menu-product-title', 'Product title text'));
  titlePriceRow.appendChild(createInputGroup('PRICE', priceInput, 'dm-menu-price', 'Price display'));
  menuPanel.appendChild(titlePriceRow);

  // Headline
  const headlineInput = document.createElement('input');
  headlineInput.type = 'text';
  headlineInput.className = 'dm-template-menu-input dm-template-menu-input-wide';
  headlineInput.value = state.headline;
  menuPanel.appendChild(createSection('HEADLINE', 'Headline or tagline', headlineInput));
  headlineInput.id = 'dm-menu-headline';

  // Color Scheme
  const colorContainer = document.createElement('div');
  colorContainer.className = 'dm-template-menu-color-swatches';
  COLOR_SWATCHES.forEach((swatch, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dm-template-menu-swatch';
    btn.style.backgroundColor = swatch.hex;
    btn.dataset.value = swatch.value;
    btn.setAttribute('aria-label', `Color ${index + 1}`);
    if (swatch.value === state.backgroundColor) {
      btn.classList.add('selected');
      btn.innerHTML = '&#10003;';
    }
    btn.addEventListener('click', () => {
      colorContainer.querySelectorAll('.dm-template-menu-swatch').forEach((s) => {
        s.classList.remove('selected');
        s.textContent = '';
      });
      btn.classList.add('selected');
      btn.innerHTML = '&#10003;';
      state.backgroundColor = swatch.value;
      updateImage();
    });
    colorContainer.appendChild(btn);
  });
  menuPanel.appendChild(createSection('COLOR SCHEME', 'Choose background color', colorContainer));

  // Reset
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'dm-template-menu-reset';
  resetBtn.innerHTML = '<span class="dm-template-menu-reset-icon" aria-hidden="true">↻</span> RESET';
  resetBtn.addEventListener('click', () => {
    state = { ...DEFAULT_STATE };
    productImageInput.value = state.productImage;
    bgImageInput.value = state.backgroundImage;
    productTitleInput.value = state.productTitle;
    priceInput.value = state.price;
    headlineInput.value = state.headline;
    state.backgroundColor = DEFAULT_STATE.backgroundColor;
    colorContainer.querySelectorAll('.dm-template-menu-swatch').forEach((s) => {
      s.classList.remove('selected');
      s.textContent = '';
      if (s.dataset.value === state.backgroundColor) {
        s.classList.add('selected');
        s.innerHTML = '&#10003;';
      }
    });
    updateImage();
  });
  menuPanel.appendChild(resetBtn);

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'dm-template-menu-preview';
  const img = document.createElement('img');
  img.className = 'dm-template-menu-image';
  img.alt = 'Dynamic Media template preview';
  img.onerror = function onError() {
    this.src = 'https://smartimaging.scene7.com/is/image/DynamicMediaNA/WKND%20Template?wid=400&hei=400&qlt=100&fit=constrain';
    this.alt = 'Fallback - template image failed to load';
  };
  imageWrapper.appendChild(img);

  function updateImage() {
    state.productImage = productImageInput.value.trim() || DEFAULT_STATE.productImage;
    state.backgroundImage = bgImageInput.value.trim() || DEFAULT_STATE.backgroundImage;
    state.productTitle = productTitleInput.value.trim() || DEFAULT_STATE.productTitle;
    state.price = priceInput.value.trim() || DEFAULT_STATE.price;
    state.headline = headlineInput.value.trim() || DEFAULT_STATE.headline;
    img.src = buildTemplateUrl(state);
  }

  [productImageInput, bgImageInput, productTitleInput, priceInput, headlineInput].forEach((el) => {
    el.addEventListener('input', updateImage);
    el.addEventListener('change', updateImage);
  });

  block.appendChild(menuPanel);
  block.appendChild(imageWrapper);
  updateImage();
}
