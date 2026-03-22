// tryb PDF
if (window.location.href.includes('pdf')) {
	document.documentElement.classList.remove('paper');
}

let profile = {};
let sectionList = [];

////////////////////////
// PAGE TEMPLATE
////////////////////////

const pageTemplate = `
<div id="a4">
	<div id="header">
		{{photo_block}}

		<div class="header-text">
			<div id="title">
				<span>{{name}}</span> {{surname}}
			</div>

			<div class="info contact-info">
				<div>{{contact_line}}</div>
			</div>

			<div class="info description-info">
				<div>{{description}}</div>
			</div>
		</div>
	</div>

	<div id="col-layout">
		<div id="first-col"></div>
		<div id="second-col"></div>
	</div>
</div>
`;

////////////////////////
// SECTION CONFIG
////////////////////////

const sectionTemplates = {
	education: `
	<div class="timeline-section">
		<div class="section-start">
			<div class="section-head first">{{educationtitle}}</div>
			{{education_first_entry}}
		</div>
		{{education_other_entries}}
	</div>
	`,

	experience: `
	<div class="timeline-section">
		<div class="section-start">
			<div class="section-head first">{{experiencetitle}}</div>
			{{experience_first_entry}}
		</div>
		{{experience_other_entries}}
	</div>
	`,

	projects: `
	<div>
		<div class="section-start">
			<div class="section-head">{{projectstitle}}</div>
			{{projects_first_entry}}
		</div>
		{{projects_other_entries}}
	</div>
	`,

	skills: `
	<div class="less-space">
		<div class="section-start">
			<div class="section-head">{{skillstitle}}</div>
			{{skills_first_entry}}
		</div>
		{{skills_other_entries}}
	</div>
	`,

	certificates: `
	<div>
		<div class="section-start">
			<div class="section-head">{{certificatestitle}}</div>
			{{certificates_first_entry}}
		</div>
		{{certificates_other_entries}}
	</div>
	`,

	rodo: `
	<div class="rodo">
		<div class="cv-entry-desc">
			{{rodo}}
		</div>
	</div>
	`
};

const entryConfigs = {
	experience: {
		dataKey: "experience",
		title: "position",
		date: "date",
		subtitle: "company",
		subtitle2: "location",
		description: "description"
	},
	projects: {
		dataKey: "projects",
		title: "name",
		date: "date",
		description: "description"
	},
	education: {
		dataKey: "education",
		title: "degree",
		date: "date",
		subtitle: "school",
		description: "coursework",
		nojustify: true
	}
};

const defaultSections = [
	'./content/experience.html',
	'./content/projects.html',
	'./content/education.html',
	'./content/skills.html',
	'./content/certificates.html',
	'./content/rodo.html'
];

////////////////////////
// BASIC HELPERS
////////////////////////

function getProfileFile() {
	const params = new URLSearchParams(window.location.search);
	return params.get("profile") || "profile.json";
}

function getSectionKey(section) {
	if (typeof section === "string") return section;
	return section?.key || section?.id || "";
}

function getSectionOrder(section, fallbackIndex = 0) {
	if (typeof section === "string") return fallbackIndex + 1;
	if (typeof section?.order === "number") return section.order;
	return fallbackIndex + 1;
}

function getSectionPath(section) {
	return `./content/${getSectionKey(section)}.html`;
}

function getSectionIdFromPath(path) {
	return path.replace('./content/', '').replace('.html', '');
}

function toFragment(html) {
	return document.createRange().createContextualFragment(html);
}

function stripHtml(html) {
	return html.replace(/<[^>]*>/g, '').trim();
}

function getValueByPath(obj, path) {
	return path.split('.').reduce((acc, key) => {
		if (acc === undefined || acc === null) return '';
		return acc[key];
	}, obj);
}

function isVisible(item) {
	return item && item.visible !== false;
}

function filterVisibleItems(dataArray) {
	if (!Array.isArray(dataArray)) return [];
	return dataArray.filter(isVisible);
}

function hasVisibleItems(dataArray) {
	return filterVisibleItems(dataArray).length > 0;
}

function joinDescriptionInline(value) {
	if (!value) return "";
	if (Array.isArray(value)) {
		return value.filter(Boolean).join(", ");
	}
	return value;
}

////////////////////////
// SECTION LIST
////////////////////////

function buildSectionList() {
	if (Array.isArray(profile.sections) && profile.sections.length > 0) {
		return profile.sections
			.map((section, index) => ({
				...((typeof section === "object" && section) ? section : { key: section }),
				_resolvedKey: getSectionKey(section),
				_resolvedOrder: getSectionOrder(section, index)
			}))
			.filter(section => section.visible !== false && section._resolvedKey)
			.sort((a, b) => a._resolvedOrder - b._resolvedOrder)
			.map(section => `./content/${section._resolvedKey}.html`);
	}

	return defaultSections;
}

function shouldRenderSection(sectionPath) {
	switch (sectionPath) {
		case './content/experience.html':
			return hasVisibleItems(profile.experience);
		case './content/projects.html':
			return hasVisibleItems(profile.projects);
		case './content/education.html':
			return hasVisibleItems(profile.education);
		case './content/skills.html':
			return hasVisibleItems(profile.skills);
		case './content/certificates.html':
			return hasVisibleItems(profile.certificates);
		case './content/rodo.html':
			return !!profile.rodo && (!profile.render || profile.render.show_rodo !== false);
		default:
			return true;
	}
}

////////////////////////
// RENDER READY
////////////////////////

async function signalRenderReady() {
	if (document.fonts && document.fonts.ready) {
		try {
			await document.fonts.ready;
		} catch (e) {}
	}

	const images = Array.from(document.querySelectorAll("#a4 img"));

	await Promise.all(
		images.map(img => {
			if (img.complete) return Promise.resolve();

			return new Promise(resolve => {
				img.onload = () => resolve();
				img.onerror = () => resolve();
			});
		})
	);

	window.__CV_RENDER_DONE__ = true;
	document.body.setAttribute("data-render-ready", "true");
	window.dispatchEvent(new Event("cv-render-ready"));
}

////////////////////////
// SIMPLE RENDERERS
////////////////////////

function renderPhotoBlock() {
	const showPhoto = !profile.render || profile.render.show_photo !== false;

	if (!profile.photo || !showPhoto) return "";

	return `
	<div class="photo">
		<img src="${profile.photo}" alt="${profile.name || ''} ${profile.surname || ''}">
	</div>
	`;
}

function renderContactLine() {
	const parts = [];

	if (profile.city) parts.push(profile.city);
	if (profile.email) parts.push(profile.email);
	if (profile.phone) parts.push(profile.phone);

	return parts.join(" | ");
}

function generateDescriptionList(arr) {
	if (!arr) return "";

	if (Array.isArray(arr)) {
		return arr.filter(Boolean).map(item => `<li>${item}</li>`).join("");
	}

	return `<li>${arr}</li>`;
}

////////////////////////
// ENTRY RENDERERS
////////////////////////

function renderEntry(item, config) {
	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${item[config.title] || ''}</strong></div>
			<div><em>${item[config.date] || ''}</em></div>
		</div>
	`;

	if (config.subtitle || config.subtitle2) {
		html += `<div class="cv-entry-byline">`;

		if (config.subtitle) {
			html += `<div><strong>${item[config.subtitle] || ''}</strong></div>`;
		}

		if (config.subtitle2) {
			html += `<div><em>${item[config.subtitle2] || ''}</em></div>`;
		}

		html += `</div>`;
	}

	if (config.description) {
		const value = item[config.description];

		if (value && (Array.isArray(value) ? value.length > 0 : true)) {
			html += `
			<div class="cv-entry-desc">
				<ul ${config.nojustify ? 'class="no-justify"' : ''}>
					${generateDescriptionList(value)}
				</ul>
			</div>
			`;
		}
	}

	html += `</div>`;
	return html;
}

function renderSkill(skill) {
	const desc = joinDescriptionInline(skill.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<strong>${skill.name || ''}</strong>
		</div>
	`;

	if (desc) {
		html += `
		<div class="cv-entry-desc">
			${desc}
		</div>
		`;
	}

	html += `</div>`;
	return html;
}

function renderCertificate(cert) {
	const desc = joinDescriptionInline(cert.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${cert.name || ''}</strong></div>
			<div><em>${cert.date || ''}</em></div>
		</div>
	`;

	if (cert.issuer) {
		html += `
		<div class="cv-entry-byline">
			<div><strong>${cert.issuer}</strong></div>
		</div>
		`;
	}

	if (desc) {
		html += `
		<div class="cv-entry-desc">
			${desc}
		</div>
		`;
	}

	html += `</div>`;
	return html;
}

function splitRenderedItems(items, renderFn) {
	const visibleItems = filterVisibleItems(items);

	if (!visibleItems.length) {
		return { first: "", rest: "" };
	}

	return {
		first: renderFn(visibleItems[0]),
		rest: visibleItems.slice(1).map(renderFn).join("")
	};
}

function renderEntrySectionParts(sectionId) {
	const config = entryConfigs[sectionId];
	if (!config) return { first: "", rest: "" };

	return splitRenderedItems(
		profile[config.dataKey],
		item => renderEntry(item, config)
	);
}

function renderSkillSectionParts() {
	return splitRenderedItems(profile.skills, renderSkill);
}

function renderCertificateSectionParts() {
	return splitRenderedItems(profile.certificates, renderCertificate);
}

////////////////////////
// PLACEHOLDERS
////////////////////////

function renderSpecialPlaceholder(path) {
	if (path === "photo_block") return renderPhotoBlock();
	if (path === "contact_line") return renderContactLine();

	const firstMatch = path.match(/^(experience|projects|education|skills|certificates)_first_entry$/);
	if (firstMatch) {
		const sectionId = firstMatch[1];

		if (sectionId === "skills") return renderSkillSectionParts().first;
		if (sectionId === "certificates") return renderCertificateSectionParts().first;

		return renderEntrySectionParts(sectionId).first;
	}

	const otherMatch = path.match(/^(experience|projects|education|skills|certificates)_other_entries$/);
	if (otherMatch) {
		const sectionId = otherMatch[1];

		if (sectionId === "skills") return renderSkillSectionParts().rest;
		if (sectionId === "certificates") return renderCertificateSectionParts().rest;

		return renderEntrySectionParts(sectionId).rest;
	}

	return null;
}

function fillPlaceholders(html) {
	return html.replace(/\{\{(.*?)\}\}/g, (match, rawPath) => {
		const path = rawPath.trim();

		const specialValue = renderSpecialPlaceholder(path);
		if (specialValue !== null) return specialValue;

		const value = getValueByPath(profile, path);
		return value === undefined || value === null ? '' : value;
	});
}

////////////////////////
// SECTION HTML
////////////////////////

async function getSectionHtml(sectionPath) {
	const sectionId = getSectionIdFromPath(sectionPath);

	if (sectionTemplates[sectionId]) {
		return sectionTemplates[sectionId];
	}

	const res = await fetch(sectionPath);
	return await res.text();
}

////////////////////////
// LOAD / RENDER
////////////////////////

function clearResume() {
	const existing = document.getElementById("a4");
	if (existing) existing.remove();

	window.__CV_RENDER_DONE__ = false;
	document.body.removeAttribute("data-render-ready");
}

async function loadResume() {
	document.body.appendChild(toFragment(fillPlaceholders(pageTemplate)));

	for (const sectionPath of sectionList) {
		if (!shouldRenderSection(sectionPath)) continue;

		let sectionHtml = await getSectionHtml(sectionPath);
		sectionHtml = fillPlaceholders(sectionHtml);

		if (!stripHtml(sectionHtml)) continue;

		document.getElementById("first-col").appendChild(toFragment(sectionHtml));
	}

	await signalRenderReady();
}

async function renderFromProfile(data) {
	profile = data || {};
	sectionList = buildSectionList();
	clearResume();
	await loadResume();
}

////////////////////////
// CONTROLS
////////////////////////

function setupControls() {
	const pasteBtn = document.getElementById("pasteBtn");
	const printBtn = document.getElementById("printBtn");
	const downloadBtn = document.getElementById("downloadBtn");

	if (pasteBtn) {
		pasteBtn.addEventListener("click", async () => {
			try {
				const text = await navigator.clipboard.readText();
				const data = JSON.parse(text);
				await renderFromProfile(data);
			} catch (err) {
				console.error("Błąd wklejania JSON:", err);
				alert("Nie udało się wkleić poprawnego JSON.");
			}
		});
	}

	if (printBtn) {
		printBtn.addEventListener("click", () => {
			window.print();
		});
	}

	// jeśli gdzieś w HTML został stary przycisk download,
	// to też zamiast pobierania odpali drukowanie
	if (downloadBtn) {
		downloadBtn.addEventListener("click", () => {
			window.print();
		});
	}
}

////////////////////////
// INIT
////////////////////////

async function init() {
	setupControls();

	try {
		const res = await fetch(getProfileFile());
		const data = await res.json();
		await renderFromProfile(data);
	} catch (err) {
		console.error("Błąd ładowania profilu JSON:", err);
	}
}

init();
