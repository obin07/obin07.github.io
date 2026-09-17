document.addEventListener('DOMContentLoaded', async () => {
	const main = document.getElementById('main-display');
	const displayCaption = document.getElementById('display-caption');
	const captionLanguageSelect = document.getElementById('caption-language-select');
	const thumbList = document.getElementById('thumb-list');
	const loadMoreBtn = document.getElementById('load-more');
	const viewer = document.getElementById('viewer');
	const viewerImg = document.getElementById('viewer-img');
	const viewerCaption = document.getElementById('viewer-caption');
	const viewerClose = document.getElementById('viewer-close');
	const viewerPrev = document.getElementById('viewer-prev');
	const viewerNext = document.getElementById('viewer-next');

	// load manifest
	let manifest = [];
	try {
		const res = await fetch('./images.json', {cache: 'no-cache'});
		manifest = await res.json();
	} catch (e) {
		console.error('Failed to load images.json', e);
		return;
	}

	if (!main || !thumbList) return;

	const thumbs = [];
	const pageSize = 24; // thumbnails per page for performance
	let rendered = 0;
	let currentIndex = 0;
	let lastFocused = null;
	let captionLanguage = localStorage.getItem('captionLanguage') || 'en';
	if (captionLanguageSelect) captionLanguageSelect.value = captionLanguage;
	document.documentElement.lang = captionLanguage === 'ne' ? 'ne' : 'en';

	function createAlt(name) {
		return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
	}

	function selectIndex(i) {
		const item = manifest[i];
		if (!item) return;
		const src = item.display || `./images/${item.file}`;
		const caption = getCaption(item);
		main.src = src;
		main.alt = item.alt || createAlt(item.file);
		main.classList.remove('hero-image-reveal');
		void main.offsetWidth;
		main.classList.add('hero-image-reveal');
		if (displayCaption) {
			displayCaption.textContent = caption;
			displayCaption.classList.remove('caption-reveal');
			void displayCaption.offsetWidth;
			displayCaption.classList.add('caption-reveal');
		}
		thumbs.forEach(t => t.classList.remove('selected'));
		thumbs[i].classList.add('selected');
		// store last viewed
		try { localStorage.setItem('lastImage', item.file); } catch(e){}
	}

	function getCaption(item) {
		return captionLanguage === 'ne' ? (item.captionNe || item.caption || '') : (item.caption || '');
	}

	// build thumbs
	function renderNextPage() {
		const start = rendered;
		const end = Math.min(manifest.length, rendered + pageSize);
		for (let idx = start; idx < end; idx++) {
			const item = manifest[idx];
			const li = document.createElement('li');
			li.setAttribute('role', 'listitem');
				// build responsive picture element if manifest contains srcset
				let clickableEl = null;
				if (item.srcset || item.webpSrcset) {
					const picture = document.createElement('picture');
					if (item.webpSrcset) {
						const sourceWebp = document.createElement('source');
						sourceWebp.type = 'image/webp';
						sourceWebp.srcset = item.webpSrcset;
						sourceWebp.sizes = item.sizes || '(max-width: 900px) 100vw, 60vw';
						picture.appendChild(sourceWebp);
					}
					if (item.srcset) {
						const sourceJ = document.createElement('source');
						sourceJ.type = 'image/jpeg';
						sourceJ.srcset = item.srcset;
						sourceJ.sizes = item.sizes || '(max-width: 900px) 100vw, 60vw';
						picture.appendChild(sourceJ);
					}
					const img = document.createElement('img');
					img.src = item.display || `./images/${item.file}`;
					img.alt = item.alt || createAlt(item.file);
					img.loading = idx < 2 ? 'eager' : 'lazy';
					if (idx === 0) img.setAttribute('fetchpriority','high');
					img.tabIndex = 0;
					picture.appendChild(img);
					li.appendChild(picture);
					clickableEl = img;
				} else {
					const img = document.createElement('img');
					img.src = `./images/${item.file}`;
					img.alt = item.alt || createAlt(item.file);
					img.loading = idx < 2 ? 'eager' : 'lazy';
					if (idx === 0) img.setAttribute('fetchpriority','high');
					img.tabIndex = 0;
					li.appendChild(img);
					clickableEl = img;
				}
				clickableEl.addEventListener('click', (e) => onThumbActivate(idx, e.currentTarget));
				clickableEl.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') onThumbActivate(idx, e.currentTarget); });
			thumbList.appendChild(li);
			thumbs.push(clickableEl);
		}
		rendered = end;
		if (rendered >= manifest.length && loadMoreBtn) loadMoreBtn.hidden = true;
	}

	thumbList.addEventListener('focusin', (e) => {
		const idx = thumbs.indexOf(e.target);
		if (window.innerWidth >= 900 && idx >= 0) selectIndex(idx);
	});

	function onThumbActivate(idx, el) {
		// on mobile open viewer, on desktop update main display
		if (window.innerWidth < 900) {
			openViewer(idx, el);
		} else {
			selectIndex(idx);
			el.focus();
		}
	}

	// initial page
	renderNextPage();
	if (loadMoreBtn) {
		if (manifest.length <= pageSize) loadMoreBtn.hidden = true;
		loadMoreBtn.addEventListener('click', () => renderNextPage());
	}

	// initial selection: lastImage or first
	const last = localStorage.getItem('lastImage');
	const startIndex = manifest.findIndex(m => m.file === last);
	selectIndex(startIndex >= 0 ? startIndex : 0);

	/* Viewer modal functions */
	function openViewer(idx, triggerEl) {
		currentIndex = idx;
		lastFocused = triggerEl || document.activeElement;
		viewer.setAttribute('aria-hidden','false');
		document.body.style.overflow = 'hidden';
		showViewerIndex(idx);
		viewerClose.focus();
		document.addEventListener('keydown', viewerKeydown);
	}

	function closeViewer() {
		viewer.setAttribute('aria-hidden','true');
		document.body.style.overflow = '';
		if (lastFocused) lastFocused.focus();
		document.removeEventListener('keydown', viewerKeydown);
	}

	function showViewerIndex(idx) {
		const item = manifest[idx];
		if (!item) return;
		const src = item.display || `./images/${item.file}`;
		viewerImg.src = src;
		viewerImg.alt = item.alt || createAlt(item.file);
		viewerCaption.textContent = getCaption(item);
		viewerCaption.lang = captionLanguage === 'ne' ? 'ne' : 'en';
		currentIndex = idx;
	}

	function viewerKeydown(e) {
		if (e.key === 'Escape') closeViewer();
		if (e.key === 'ArrowLeft') showViewerIndex((currentIndex -1 + manifest.length)%manifest.length);
		if (e.key === 'ArrowRight') showViewerIndex((currentIndex +1)%manifest.length);
	}

	viewerClose.addEventListener('click', closeViewer);
	viewerPrev.addEventListener('click', () => showViewerIndex((currentIndex -1 + manifest.length)%manifest.length));
	viewerNext.addEventListener('click', () => showViewerIndex((currentIndex +1)%manifest.length));
	if (captionLanguageSelect) {
		captionLanguageSelect.addEventListener('change', () => {
			captionLanguage = captionLanguageSelect.value;
			localStorage.setItem('captionLanguage', captionLanguage);
			document.documentElement.lang = captionLanguage === 'ne' ? 'ne' : 'en';
			selectIndex(currentIndex);
			if (viewer.getAttribute('aria-hidden') === 'false') showViewerIndex(currentIndex);
		});
	}

});
