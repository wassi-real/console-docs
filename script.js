/**
 * MintMVP API docs — static site behavior
 */

(function () {
	const STORAGE_ORIGIN = 'mintmvp-docs-origin';
	const STORAGE_PROJECT = 'mintmvp-docs-project-id';

	const endpoints = [
		{
			id: 'specs',
			label: 'Specs',
			get: {
				desc: 'List all specs',
				response: '{ "data": [ { id, project_id, title, summary, goal, status, ... } ] }'
			},
			post: {
				desc: 'Create a spec',
				body: '{ "title": "Feature X", "summary": "...", "goal": "...", "status": "draft" }',
				required: ['title'],
				optional: ['summary', 'goal', 'acceptance_criteria', 'edge_cases', 'regression_risks', 'status']
			}
		},
		{
			id: 'tasks',
			label: 'Tasks',
			get: {
				desc: 'List all tasks',
				response: '{ "data": [ { id, title, status, priority, assignee, ... } ] }'
			},
			post: {
				desc: 'Create a task',
				body: '{ "title": "Fix bug", "priority": "high", "status": "backlog" }',
				required: ['title'],
				optional: ['description', 'status', 'priority', 'assignee']
			}
		},
		{
			id: 'tests',
			label: 'Tests',
			get: {
				desc: 'List all tests',
				response: '{ "data": [ { id, name, type, status, last_run, notes } ] }'
			},
			post: {
				desc: 'Create a test',
				body: '{ "name": "Login flow", "type": "integration", "status": "pending" }',
				required: ['name'],
				optional: ['type', 'status', 'notes']
			}
		},
		{
			id: 'incidents',
			label: 'Incidents',
			get: {
				desc: 'List all incidents',
				response: '{ "data": [ { id, title, severity, status, description, ... } ] }'
			},
			post: {
				desc: 'Report an incident',
				body: '{ "title": "API down", "severity": "critical" }',
				required: ['title'],
				optional: ['severity', 'status', 'description']
			}
		},
		{
			id: 'reports',
			label: 'Reports',
			get: {
				desc: 'List all reports',
				response: '{ "data": [ { id, title, content, created_by, ... } ] }'
			},
			post: {
				desc: 'Create a report',
				body: '{ "title": "Sprint 1 Summary", "content": "# Report\\n..." }',
				required: ['title'],
				optional: ['content']
			}
		},
		{
			id: 'deployments',
			label: 'Deployments',
			get: {
				desc: 'List all deployments',
				response: '{ "data": [ { id, version, environment, status, notes, ... } ] }'
			},
			post: {
				desc: 'Log a deployment',
				body: '{ "version": "v1.2.0", "environment": "production", "status": "success" }',
				required: ['version'],
				optional: ['environment', 'status', 'notes']
			}
		}
	];

	function normalizeOrigin(raw) {
		const s = (raw || '').trim().replace(/\/$/, '');
		if (!s) return '';
		try {
			const u = new URL(s.includes('://') ? s : 'https://' + s);
			return u.origin;
		} catch {
			return '';
		}
	}

	function buildBaseUrl() {
		const originIn = document.getElementById('cfg-origin');
		const projectIn = document.getElementById('cfg-project');
		const origin = normalizeOrigin(originIn?.value || '');
		const pid = (projectIn?.value || '').trim();
		if (!origin || !pid) return '';
		return `${origin}/api/v1/projects/${pid}`;
	}

	function updateBaseUrlDisplay() {
		const el = document.getElementById('base-url-value');
		const url = buildBaseUrl();
		if (el) {
			el.textContent =
				url ||
				'Enter your console URL and project UUID above to see example request URLs.';
		}

		document.querySelectorAll('[data-curl-get]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			const u = buildBaseUrl();
			pre.textContent = u
				? `curl -H "Authorization: Bearer mint_YOUR_KEY" \\\n  ${u}/${path}`
				: `curl -H "Authorization: Bearer mint_YOUR_KEY" \\\n  YOUR_BASE_URL/api/v1/projects/YOUR_PROJECT_ID/${path}`;
		});

		document.querySelectorAll('[data-curl-post]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			let body = pre.getAttribute('data-body') || '{}';
			body = body.replace(/&#39;/g, "'");
			const u = buildBaseUrl();
			const base = u || 'YOUR_BASE_URL/api/v1/projects/YOUR_PROJECT_ID';
			pre.textContent = `curl -X POST \\\n  -H "Authorization: Bearer mint_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}' \\\n  ${u ? `${u}/${path}` : `${base}/${path}`}`;
		});
	}

	function mountEndpoints() {
		const root = document.getElementById('endpoints-root');
		if (!root) return;

		root.innerHTML = endpoints
			.map(
				(ep) => `
			<div class="endpoint" data-endpoint="${ep.id}">
				<button type="button" class="endpoint-header" aria-expanded="false" aria-controls="panel-${ep.id}">
					<div class="endpoint-title">
						<span class="badge badge-get">GET</span>
						<span class="badge badge-post">POST</span>
						<span class="endpoint-path">/${ep.id}</span>
					</div>
					<span class="endpoint-chevron" aria-hidden="true">▼</span>
				</button>
				<div class="endpoint-body" id="panel-${ep.id}">
					<div class="stack">
						<div>
							<div class="block-title"><span class="badge badge-get">GET</span> ${escapeHtml(ep.get.desc)}</div>
							<p class="label">curl</p>
							<pre class="block" data-curl-get data-path="${ep.id}"></pre>
							<p class="label">Response</p>
							<pre class="block">${escapeHtml(ep.get.response)}</pre>
						</div>
						<div>
							<div class="block-title"><span class="badge badge-post">POST</span> ${escapeHtml(ep.post.desc)}</div>
							<p class="muted">
								<strong>Required:</strong> ${escapeHtml(ep.post.required.join(', '))}
							</p>
							${
								ep.post.optional.length
									? `<p class="muted"><strong>Optional:</strong> ${escapeHtml(ep.post.optional.join(', '))}</p>`
									: ''
							}
							<p class="label">curl</p>
							<pre class="block" data-curl-post data-path="${ep.id}" data-body='${dataBodyAttr(ep.post.body)}'></pre>
						</div>
					</div>
				</div>
			</div>`
			)
			.join('');

		root.querySelectorAll('.endpoint-header').forEach((btn) => {
			btn.addEventListener('click', () => {
				const card = btn.closest('.endpoint');
				const open = card.classList.toggle('is-open');
				btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			});
		});

		updateBaseUrlDisplay();
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function dataBodyAttr(s) {
		/* single-quoted attribute so JSON can contain double quotes */
		return String(s).replace(/\\/g, '\\\\').replace(/'/g, '&#39;');
	}

	function initConfig() {
		const originIn = document.getElementById('cfg-origin');
		const projectIn = document.getElementById('cfg-project');
		if (originIn) {
			const q = new URLSearchParams(window.location.search).get('origin');
			originIn.value =
				q || localStorage.getItem(STORAGE_ORIGIN) || 'https://console.mintmvp.com';
		}
		if (projectIn) {
			const q = new URLSearchParams(window.location.search).get('project');
			projectIn.value = q || localStorage.getItem(STORAGE_PROJECT) || '';
		}

		const save = () => {
			localStorage.setItem(STORAGE_ORIGIN, originIn?.value || '');
			localStorage.setItem(STORAGE_PROJECT, projectIn?.value || '');
			updateBaseUrlDisplay();
		};

		originIn?.addEventListener('input', save);
		projectIn?.addEventListener('input', save);
		save();
	}

	function initSidebar() {
		const toggle = document.getElementById('nav-toggle');
		const sidebar = document.querySelector('.sidebar');

		toggle?.addEventListener('click', () => {
			sidebar?.classList.toggle('nav-open');
			const open = sidebar?.classList.contains('nav-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});

		// Highlight active anchor
		const links = document.querySelectorAll('.sidebar a[href^="#"]');
		const sections = document.querySelectorAll('main section[id]');

		function onScroll() {
			let current = '';
			sections.forEach((sec) => {
				const top = sec.getBoundingClientRect().top;
				if (top <= 120) current = sec.id;
			});
			links.forEach((a) => {
				const href = a.getAttribute('href');
				a.classList.toggle('is-active', href === '#' + current);
			});
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	}

	function scrollToDocs() {
		document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' });
		if (window.innerWidth <= 900) {
			document.querySelector('.sidebar')?.classList.remove('nav-open');
		}
	}

	document.getElementById('hero-scroll-docs')?.addEventListener('click', (e) => {
		e.preventDefault();
		scrollToDocs();
	});

	initConfig();
	mountEndpoints();
	initSidebar();
})();
