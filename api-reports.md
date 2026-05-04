# Reports REST API

Project reports support optional **folders** (`report_folders`). Reports reference a folder via **`folder_id`** (nullable). Deleting a folder in the console removes its reports (database cascade).

Authentication matches other project APIs: `Authorization: Bearer mint_...` (project-scoped key).

## List reports (includes folders and grouping)

```http
GET /api/v1/projects/{projectId}/reports
```

**Response**

| Field | Description |
| --- | --- |
| **`data`** | Array of all report rows for the project, newest `updated_at` first. Each row includes **`folder_id`** (`null` if uncategorized). |
| **`folders`** | Array of folder rows (`id`, `project_id`, `name`, `icon`, `sort_order`, `created_at`, `updated_at`), ordered like the UI (`sort_order`, then name). |
| **`meta.reports_by_folder`** | Map for quick lookups: always includes **`uncategorized`** (reports with no folder). Each folder **`id`** from **`folders`** is also a key whose value is an array of reports in that folder (possibly empty). |

Same report appears exactly once in **`data`** and once inside **`meta.reports_by_folder`** under the matching key (`uncategorized` or folder UUID).

Example shape:

```json
{
  "data": [{ "id": "…", "folder_id": null, "title": "…", "…": "…" }],
  "folders": [{ "id": "…", "name": "Q1", "icon": "📁", "sort_order": 0, "…": "…" }],
  "meta": {
    "reports_by_folder": {
      "uncategorized": [],
      "folder-uuid-here": []
    }
  }
}
```

## Single report

```http
GET /api/v1/projects/{projectId}/reports/{reportId}
```

Returns **`404`** if the report is missing or not in this project.

**Response**

- **`data`**: Full report row (includes **`folder_id`**).
- **`meta.folder`**: Folder row if **`folder_id`** is set and the folder exists; otherwise **`null`**.

## Create report

```http
POST /api/v1/projects/{projectId}/reports
Content-Type: application/json
```

| Field | Required | Notes |
| --- | --- | --- |
| **`title`** | yes | |
| **`content`** | no | Defaults to empty string |
| **`folder_id`** | no | Must belong to this project; invalid values return **`400`** |

**Success**

- **`201`** with **`{ data }`** — created report row.

## Update report

```http
PATCH /api/v1/projects/{projectId}/reports/{reportId}
Content-Type: application/json
```

Send any subset of:

- **`title`**, **`content`**, **`folder_id`** (`null` or empty string moves the report to uncategorized).

Invalid **`folder_id`** returns **`400`**.

## Delete report

```http
DELETE /api/v1/projects/{projectId}/reports/{reportId}
```

**Success**: **`200`** with `{ "success": true }`.

## Managing folders

Folder **create / rename / icon / delete** is not exposed as separate REST routes in this version; use the console **Project → Reports** UI or Supabase directly. Listing and grouping are covered by **`GET .../reports`** above.
