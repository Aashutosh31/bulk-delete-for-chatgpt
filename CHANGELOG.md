# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-13

First public release.

### Added

- Checkbox multi-select of ChatGPT conversations, with Shift+click ranges and
  filter-scoped "select all shown".
- Search and an Archived toggle; pinned, archived, and project membership badges.
- Permanent deletion via one `DELETE /backend-api/conversation/id/{id}` request per
  selected chat, sequentially, with delay and jitter.
- Dry-run mode, on by default, that sends no delete requests.
- Typed-count confirmation and a per-run batch cap (default 25).
- Abort between requests; stop on `401`/`429`; one retry on transient `5xx`.
- Post-run reconciliation: the server total must drop by exactly the number of
  successful deletes.
- In-memory action log with JSON export; local settings plus last-run counts, no
  titles or IDs; **Clear data** button.
- Firefox MV3 and Chrome MV3 manifests, store-ready packaging, and icons.
- End-to-end test suite against a self-signed fake `chatgpt.com`, a manifest checker,
  a source privacy guard, and CI/release workflows.
