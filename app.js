document.addEventListener('DOMContentLoaded', async () => {
	const main = document.getElementById('main-display');
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

	function createAlt(name) {
		return name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
	}

	function selectIndex(i) {
		const item = manifest[i];
		if (!item) return;
		const src = item.display || `./images/${item.file}`;
		main.src = src;
		main.alt = item.alt || createAlt(item.file);
		thumbs.forEach(t => t.classList.remove('selected'));
		thumbs[i].classList.add('selected');
		// store last viewed
		try { localStorage.setItem('lastImage', item.file); } catch(e){}
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
		viewerCaption.textContent = viewerImg.alt;
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

	// Dark-mode toggle (preserve existing behavior)
	const toggle = document.getElementById('dark-toggle');
	const saved = localStorage.getItem('theme');
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	function applyTheme(dark) { document.body.classList.toggle('dark', dark); if (toggle) toggle.setAttribute('aria-pressed', dark ? 'true' : 'false'); }
	if (saved === 'dark' || (saved === null && prefersDark)) applyTheme(true); else applyTheme(false);
	if (toggle) {
		toggle.tabIndex = 0;
		toggle.addEventListener('click', () => { const isDark = !document.body.classList.contains('dark'); applyTheme(isDark); localStorage.setItem('theme', isDark ? 'dark' : 'light'); });
		toggle.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') toggle.click(); });
	}
});
