// tryb PDF
if (window.location.href.includes('pdf')) {
	document.documentElement.classList.remove('paper');
}

let sectionList = [];
let profile = {};

const pageTemplate = `
	<div id="a4">
		<div id="header">
			<div class="photo">
				<img src="{{photo}}" alt="{{name}} {{surname}}">
			</div>

			<div class="header-text">
				<div id="title"><span>{{name}}</span> {{surname}}</div>
				<div id="subtitle">{{subtitle}}</div>

				<div class="info contact-info">
					<div>{{city}}</div>
					<div>{{email}}</div>
					<div>{{phone}}</div>
				</div>

				<div class="info description-info">
					<div>{{description}}</div>
				</div>
			</div>
		</div>

		<div id="content"></div>
	</div>
`;

function safe(val) {
	return val || '';
}

function joinDescriptionInline(description) {
	if (!description) return '';

	if (Array.isArray(description)) {
		return description.filter(Boolean).join(' ');
	}

	return description;
}

function renderList(items) {
	if (!items || !items.length) return '';

	return `
		<ul>
			${items.map(item => `<li>${item}</li>`).join('')}
		</ul>
	`;
}

function renderSkill(skill) {
	const desc = joinDescriptionInline(skill.description);

	return `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<strong>${safe(skill.name)}</strong>
		</div>
		<div class="cv-entry-desc">
			${desc}
		</div>
	</div>
	`;
}

function renderCertificate(cert) {
	const desc = joinDescriptionInline(cert.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${safe(cert.name)}</strong></div>
			<div><em>${safe(cert.date)}</em></div>
		</div>
	`;

	if (cert.issuer) {
		html += `
		<div class="cv-entry-byline">
			<div><strong>${safe(cert.issuer)}</strong></div>
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

function renderEducation(edu) {
	const desc = joinDescriptionInline(edu.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${safe(edu.degree)}</strong></div>
			<div><em>${safe(edu.date)}</em></div>
		</div>
	`;

	if (edu.school) {
		html += `
		<div class="cv-entry-byline">
			<div>${safe(edu.school)}</div>
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

function renderExperience(exp) {
	const desc = joinDescriptionInline(exp.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${safe(exp.position)}</strong></div>
			<div><em>${safe(exp.date)}</em></div>
		</div>
	`;

	if (exp.company) {
		html += `
		<div class="cv-entry-byline">
			<div>${safe(exp.company)}</div>
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

	if (exp.list && exp.list.length) {
		html += renderList(exp.list);
	}

	html += `</div>`;
	return html;
}

function renderProject(project) {
	const desc = joinDescriptionInline(project.description);

	let html = `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<div><strong>${safe(project.name)}</strong></div>
			<div><em>${safe(project.date)}</em></div>
		</div>
	`;

	if (project.subtitle) {
		html += `
		<div class="cv-entry-byline">
			<div>${safe(project.subtitle)}</div>
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

	if (project.list && project.list.length) {
		html += renderList(project.list);
	}

	html += `</div>`;
	return html;
}

function renderRodo(rodo) {
	const desc = joinDescriptionInline(rodo.description || rodo.text || rodo);

	return `
	<div class="rodo">
		<div class="cv-entry-desc">${desc}</div>
	</div>
	`;
}

function renderSection(sectionKey, sectionTitle, items) {
	if (!items || !items.length) return '';

	let entries = '';

	switch (sectionKey) {
		case 'skills':
			entries = items.map(renderSkill).join('');
			break;
		case 'certificates':
			entries = items.map(renderCertificate).join('');
			break;
		case 'education':
			entries = items.map(renderEducation).join('');
			break;
		case 'experience':
			entries = items.map(renderExperience).join('');
			break;
		case 'projects':
			entries = items.map(renderProject).join('');
			break;
		case 'rodo':
			entries = Array.isArray(items)
				? items.map(renderRodo).join('')
				: renderRodo(items);
			break;
		default:
			return '';
	}

	return `
		<div class="section-start">
			<div class="section-head">${sectionTitle}</div>
			${entries}
		</div>
	`;
}

function buildCV(data) {
	profile = data || {};
	sectionList = data.sections || [];

	let html = pageTemplate
		.replace('{{photo}}', safe(data.photo))
		.replace('{{name}}', safe(data.name))
		.replace('{{surname}}', safe(data.surname))
		.replace('{{subtitle}}', safe(data.subtitle))
		.replace('{{city}}', safe(data.city))
		.replace('{{email}}', safe(data.email))
		.replace('{{phone}}', safe(data.phone))
		.replace('{{description}}', safe(data.description));

	const content = sectionList.map(section => {
		const titleKey = `${section}title`;
		const sectionTitle = data[titleKey] || section;
		const items = data[section];
		return renderSection(section, sectionTitle, items);
	}).join('');

	html = html.replace('{{content}}', content);

	document.getElementById('resume-root').innerHTML = html;
}

function normalizeFilePart(text) {
	return (text || '')
		.toString()
		.trim()
		.replace(/[\\/:"*?<>|]+/g, '')
		.replace(/\s+/g, ' ');
}

function getPdfFileName() {
	const fullName = normalizeFilePart(
		`${safe(profile.name)} ${safe(profile.surname)}`
	);

	const company =
		normalizeFilePart(profile.company) ||
		normalizeFilePart(profile.companyName) ||
		normalizeFilePart(profile.targetCompany) ||
		normalizeFilePart(profile.nazwafirmy);

	return [fullName, company].filter(Boolean).join('_') + '.pdf';
}

async function generatePDF() {
	const element = document.getElementById('a4');
	if (!element) return;

	const fileName = getPdfFileName();

	const opt = {
		margin: 0,
		filename: fileName,
		image: { type: 'jpeg', quality: 0.98 },
		html2canvas: {
			scale: 2,
			useCORS: true,
			scrollX: 0,
			scrollY: 0
		},
		jsPDF: {
			unit: 'mm',
			format: 'a4',
			orientation: 'portrait'
		},
		pagebreak: {
			mode: ['avoid-all', 'css', 'legacy']
		}
	};

	await html2pdf().set(opt).from(element).save();
}

document.getElementById('printBtn')?.addEventListener('click', async () => {
	try {
		await generatePDF();
	} catch (err) {
		console.error('Błąd generowania PDF:', err);
		alert('Nie udało się wygenerować PDF.');
	}
});

document.getElementById('pasteBtn')?.addEventListener('click', async () => {
	try {
		const text = await navigator.clipboard.readText();
		const data = JSON.parse(text);
		buildCV(data);
	} catch (err) {
		console.error('Błąd wklejania JSON:', err);
		alert('Nie udało się wkleić poprawnego JSON.');
	}
});
