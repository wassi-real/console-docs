# Milestones REST API

Endpoints under `/api/v1/projects/:projectId/milestones` manage milestones configured for the project, including **nested slices** (`milestone_slices`) and **`linked_task_ids`** from `milestone_task_links`.

Authentication matches other project APIs: `Authorization: Bearer mint_...` (project-scoped key).

## List milestones

```http
GET /api/v1/projects/{projectId}/milestones
```

**Response**

- `data`: array of milestone rows. Each item includes all columns from `milestones`, plus:
  - `slices`: `milestone_slices` rows sorted by phase and schedule (same ordering as the UI).
  - `linked_task_ids`: UUIDs from `milestone_task_links`.
- `meta.phase_descriptions`: map of phase key → short human-readable description (`discovery`, `planning`, … `closed`). Use this to label phases in integrations without hard-coding strings.

## Single milestone

```http
GET /api/v1/projects/{projectId}/milestones/{milestoneId}
```

Returns **`404`** if the milestone does not exist or belongs to another project.

**Response**

- `data`: one milestone object with `slices` and `linked_task_ids` as above.
- `meta.phase_descriptions`: same map as the list endpoint.

## Create milestone

```http
POST /api/v1/projects/{projectId}/milestones
Content-Type: application/json
```

Required fields mirror the Milestones UI:

- `title`, `description`, `estimate`, `due_date`
- `approval_owner_user_id` (must be an organization user on the project)
- `entry_gate`, `exit_gate`
- `test_gate_required_tests`, `test_gate_pass_threshold`, `test_gate_environment`

Optional fields include `priority`, `phase`, `spec_id`, `owner_user_id`, text fields (`notes`, `dependencies`, `risks_blockers`, `deliverables`), finance (`amount`, `status`, `paid_date`, `attach_bill`, `bill_amount`, `bill_status`), `linked_task_ids`, and slices via **`slices`** (JSON array) or **`slices_json`** (stringified JSON array).

**Success**

- **`201 Created`** with the same **`data`** / **`meta`** shape as GET single (the new milestone including slices and links).

## Update milestone

```http
PATCH /api/v1/projects/{projectId}/milestones/{milestoneId}
Content-Type: application/json
```

Send **any subset** of milestone fields. Omitted keys keep their current database values. After merging, the combined milestone must still satisfy the same validation rules as create (required gates, approval owner present and valid in the org, bill rules when `attach_bill` is true, etc.).

- Include **`slices`** or **`slices_json`** only when replacing slices; omit both to leave slices unchanged.
- Include **`linked_task_ids`** only when replacing task links; omit to leave links unchanged.

**Success**

- **`200 OK`** with **`data`** / **`meta`** shaped like GET single.

## Delete milestone

```http
DELETE /api/v1/projects/{projectId}/milestones/{milestoneId}
```

Deletes the milestone row; related slices and task links are removed via foreign-key cascades.

**Success**

- **`200 OK`** with `{ "success": true }`.

## Slice payload

Each slice includes fields such as `title`, `notes`, `estimate`, `phase`, `status`, `depends_on`, `start_date`, `deadline`, `owner_user_id`, etc., subject to your Supabase schema. Slice `owner_user_id` must belong to an organization user or it is cleared server-side.
