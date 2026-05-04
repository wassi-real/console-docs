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
			singular: 'spec',
			get: {
				desc: 'List all specs',
				response: '{ "data": [ { id, project_id, title, summary, goal, status, ... } ] }'
			},
			post: {
				desc: 'Create a spec',
				body: '{ "title": "Feature X", "summary": "...", "goal": "...", "status": "draft" }',
				required: ['title'],
				optional: ['summary', 'goal', 'acceptance_criteria', 'edge_cases', 'regression_risks', 'status']
			},
			patch: {
				desc: 'Update a spec (partial)',
				body: '{ "summary": "...", "acceptance_criteria": "...", "edge_cases": "...", "regression_risks": "..." }',
				optional: ['title', 'summary', 'goal', 'acceptance_criteria', 'edge_cases', 'regression_risks', 'status']
			},
			del: { desc: 'Delete a spec' }
		},
		{
			id: 'milestones',
			label: 'Milestones',
			singular: 'milestone',
			paramName: 'milestoneId',
			get: {
				desc: 'List milestones with nested slices and linked_task_ids',
				response:
					'{ "data": [ { …milestone columns…, "slices": [...], "linked_task_ids": ["uuid"] } ], "meta": { "phase_descriptions": { "discovery": "…", … } } }'
			},
			getOne: {
				desc: 'Get one milestone (full row + sorted slices + linked_task_ids)',
				response:
					'{ "data": { …milestone…, "slices": [...], "linked_task_ids": [...] }, "meta": { "phase_descriptions": { … } } }'
			},
			post: {
				desc: 'Create a milestone (same validation as the Milestones UI)',
				body:
					'{ "title": "Beta launch", "description": "Ship MVP", "estimate": "40h", "due_date": "2026-05-01", "approval_owner_user_id": "<org-user-uuid>", "entry_gate": "Spec approved", "exit_gate": "Deployed to prod", "test_gate_required_tests": "Smoke + regression", "test_gate_pass_threshold": "100% smoke", "test_gate_environment": "staging", "linked_task_ids": [], "slices": [] }',
				required: [
					'title',
					'description',
					'estimate',
					'due_date',
					'approval_owner_user_id',
					'entry_gate',
					'exit_gate',
					'test_gate_required_tests',
					'test_gate_pass_threshold',
					'test_gate_environment'
				],
				optional: [
					'priority',
					'phase',
					'spec_id',
					'owner_user_id',
					'notes',
					'dependencies',
					'risks_blockers',
					'deliverables',
					'amount',
					'status',
					'paid_date',
					'attach_bill',
					'bill_amount',
					'bill_status',
					'linked_task_ids',
					'slices',
					'slices_json'
				]
			},
			patch: {
				desc: 'Update a milestone (partial merge)',
				body: '{ "title": "Beta launch (delayed)" }',
				optional: [
					'title',
					'description',
					'estimate',
					'due_date',
					'approval_owner_user_id',
					'entry_gate',
					'exit_gate',
					'test_gate_required_tests',
					'test_gate_pass_threshold',
					'test_gate_environment',
					'priority',
					'phase',
					'spec_id',
					'owner_user_id',
					'notes',
					'dependencies',
					'risks_blockers',
					'deliverables',
					'amount',
					'status',
					'paid_date',
					'attach_bill',
					'bill_amount',
					'bill_status',
					'linked_task_ids',
					'slices',
					'slices_json'
				]
			},
			del: { desc: 'Delete a milestone' }
		},
		{
			id: 'tasks',
			label: 'Tasks',
			singular: 'task',
			get: {
				desc: 'List all tasks',
				response: '{ "data": [ { id, title, status, priority, assignee, ... } ] }'
			},
			post: {
				desc: 'Create a task',
				body: '{ "title": "Fix bug", "priority": "high", "status": "backlog" }',
				required: ['title'],
				optional: ['description', 'status', 'priority', 'assignee', 'spec_id']
			},
			patch: {
				desc: 'Update a task (partial)',
				body: '{ "status": "in_progress", "priority": "high" }',
				optional: ['title', 'description', 'status', 'priority', 'assignee', 'spec_id']
			},
			del: { desc: 'Delete a task' }
		},
		{
			id: 'tests',
			label: 'Tests',
			singular: 'test',
			get: {
				desc: 'List all tests',
				response: '{ "data": [ { id, name, type, status, last_run, notes, spec_id, task_id } ] }'
			},
			post: {
				desc: 'Create a test',
				body: '{ "name": "Login flow", "type": "e2e", "status": "pending" }',
				required: ['name'],
				optional: ['type', 'status', 'notes', 'spec_id', 'task_id']
			},
			patch: {
				desc: 'Update a test (partial)',
				body: '{ "status": "pass", "notes": "All assertions passed" }',
				optional: ['name', 'type', 'status', 'last_run', 'notes', 'spec_id', 'task_id']
			},
			del: { desc: 'Delete a test' }
		},
		{
			id: 'incidents',
			label: 'Incidents',
			singular: 'incident',
			get: {
				desc: 'List all incidents',
				response: '{ "data": [ { id, title, severity, status, description, ... } ] }'
			},
			post: {
				desc: 'Report an incident',
				body: '{ "title": "API down", "severity": "critical" }',
				required: ['title'],
				optional: ['severity', 'status', 'description']
			},
			patch: {
				desc: 'Update an incident (partial)',
				body: '{ "status": "resolved", "resolved_at": "2026-03-16T12:00:00Z" }',
				optional: ['title', 'severity', 'status', 'description', 'resolved_at']
			},
			del: { desc: 'Delete an incident' }
		},
		{
			id: 'reports',
			label: 'Reports',
			singular: 'report',
			paramName: 'reportId',
			get: {
				desc: 'List all reports plus folders and meta.reports_by_folder',
				response:
					'{ "data": [...reports], "folders": [...], "meta": { "reports_by_folder": { "uncategorized": [...], "<folder_uuid>": [...] } } }'
			},
			getOne: {
				desc: 'Get one report; meta.folder when report has folder_id',
				response: '{ "data": { …report… }, "meta": { "folder": null | { …folder… } } }'
			},
			post: {
				desc: 'Create a report',
				body: '{ "title": "Sprint 1 Summary", "content": "# Report\\n...", "folder_id": "<uuid>" }',
				required: ['title'],
				optional: ['content', 'folder_id']
			},
			patch: {
				desc: 'Update a report (partial)',
				body: '{ "folder_id": null, "title": "...", "content": "..." }',
				optional: ['title', 'content', 'folder_id']
			},
			del: { desc: 'Delete a report' }
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

		const u = buildBaseUrl();
		const fallback = 'YOUR_BASE_URL/api/v1/projects/YOUR_PROJECT_ID';
		const base = u || fallback;

		document.querySelectorAll('[data-curl-get]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			pre.textContent = `curl -H "Authorization: Bearer mint_YOUR_KEY" \\\n  ${base}/${path}`;
		});

		document.querySelectorAll('[data-curl-get-single]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			pre.textContent = `curl -H "Authorization: Bearer mint_YOUR_KEY" \\\n  ${base}/${path}/ITEM_UUID`;
		});

		document.querySelectorAll('[data-curl-post]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			let body = pre.getAttribute('data-body') || '{}';
			body = body.replace(/&#39;/g, "'");
			pre.textContent = `curl -X POST \\\n  -H "Authorization: Bearer mint_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}' \\\n  ${base}/${path}`;
		});

		document.querySelectorAll('[data-curl-patch]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			let body = pre.getAttribute('data-body') || '{}';
			body = body.replace(/&#39;/g, "'");
			pre.textContent = `curl -X PATCH \\\n  -H "Authorization: Bearer mint_YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}' \\\n  ${base}/${path}/ITEM_UUID`;
		});

		document.querySelectorAll('[data-curl-delete]').forEach((pre) => {
			const path = pre.getAttribute('data-path');
			pre.textContent = `curl -X DELETE \\\n  -H "Authorization: Bearer mint_YOUR_KEY" \\\n  ${base}/${path}/ITEM_UUID`;
		});
	}

	function mountEndpoints() {
		const root = document.getElementById('endpoints-root');
		if (!root) return;

		root.innerHTML = endpoints.map((ep) => renderEndpointCard(ep)).join('');

		root.querySelectorAll('.endpoint-header').forEach((btn) => {
			btn.addEventListener('click', () => {
				const card = btn.closest('.endpoint');
				const open = card.classList.toggle('is-open');
				btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			});
		});

		updateBaseUrlDisplay();
	}

	function renderEndpointCard(ep) {
		if (ep.readOnly) {
			const param = ep.paramName || 'id';
			return `
			<div class="endpoint" data-endpoint="${ep.id}">
				<button type="button" class="endpoint-header" aria-expanded="false" aria-controls="panel-${ep.id}">
					<div class="endpoint-title">
						<span class="badge badge-get">GET</span>
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
							<div class="block-title"><span class="badge badge-get">GET</span> ${escapeHtml(ep.getOne.desc)}</div>
							<p class="muted">Path: <code class="inline-code">/${ep.id}/&lt;${param}&gt;</code></p>
							<p class="label">curl</p>
							<pre class="block" data-curl-get-single data-path="${ep.id}"></pre>
							<p class="label">Response</p>
							<pre class="block">${escapeHtml(ep.getOne.response)}</pre>
						</div>
						<p class="muted">Read-only — create and edit milestones in the console UI.</p>
					</div>
				</div>
			</div>`;
		}
		return `
			<div class="endpoint" data-endpoint="${ep.id}">
				<button type="button" class="endpoint-header" aria-expanded="false" aria-controls="panel-${ep.id}">
					<div class="endpoint-title">
						<span class="badge badge-get">GET</span>
						<span class="badge badge-post">POST</span>
						${ep.patch ? '<span class="badge badge-patch">PATCH</span>' : ''}
						${ep.del ? '<span class="badge badge-delete">DELETE</span>' : ''}
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
							<div class="block-title"><span class="badge badge-get">GET</span> Get a single ${escapeHtml(ep.singular)}</div>
							<p class="muted">Path: <code class="inline-code">/${ep.id}/&lt;id&gt;</code></p>
							<p class="label">curl</p>
							<pre class="block" data-curl-get-single data-path="${ep.id}"></pre>
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
						${
							ep.patch
								? `<div>
							<div class="block-title"><span class="badge badge-patch">PATCH</span> ${escapeHtml(ep.patch.desc)}</div>
							<p class="muted">Path: <code class="inline-code">/${ep.id}/&lt;id&gt;</code> — send any subset of fields.</p>
							<p class="muted"><strong>Optional (any subset):</strong> ${escapeHtml(ep.patch.optional.join(', '))}</p>
							<p class="label">curl</p>
							<pre class="block" data-curl-patch data-path="${ep.id}" data-body='${dataBodyAttr(ep.patch.body)}'></pre>
						</div>`
								: ''
						}
						${
							ep.del
								? `<div>
							<div class="block-title"><span class="badge badge-delete">DELETE</span> ${escapeHtml(ep.del.desc)}</div>
							<p class="muted">Path: <code class="inline-code">/${ep.id}/&lt;id&gt;</code></p>
							<p class="label">curl</p>
							<pre class="block" data-curl-delete data-path="${ep.id}"></pre>
							<p class="label">Response</p>
							<pre class="block">{ "success": true }</pre>
						</div>`
								: ''
						}
					</div>
				</div>
			</div>`;
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function dataBodyAttr(s) {
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
