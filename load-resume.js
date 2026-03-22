function renderSkill(skill) {
	const desc = joinDescriptionInline(skill.description);

	return `
	<div class="cv-entry">
		<div class="cv-entry-heading">
			<strong>${skill.name || ''}</strong>
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
