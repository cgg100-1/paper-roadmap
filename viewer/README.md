# Paper Roadmap Viewer

This is a read-only, static version of Paper Roadmap designed to be opened directly from downloaded files on a work laptop.

## How to use it

1. Download the repository ZIP from GitHub and unzip it.
2. Open `viewer/index.html` in a current Chrome or Edge browser.
3. Click **Open roadmap.xlsx** and choose your workbook.
4. Edit the workbook in Excel and save it.
5. Back in the viewer, click **Reload workbook** and choose the same file again.

There is no front-end editing and nothing is uploaded. The workbook is read locally in the browser.

## Workbook structure

### Items (required)

| Item | Parent | Start | End | Team | Owner | Status | Colour | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Platform Observability | | 01/09/2026 | 30/11/2026 | Platform | Priya | active | #B8D4B8 | Example top-level item |
| Service dashboard rollout | Platform Observability | 15/09/2026 | 31/10/2026 | Platform | Priya | active | #B8D4B8 | Example child |

`Item` (or `Title`), `Start`, and `End` are required. `Parent` should match another item title. ISO dates (`2026-09-01`), normal UK Excel dates (`01/09/2026`), and Excel date cells are supported.

Optional columns include `ID`, `Team`, `Owner`, `Status`, `Colour`/`Color`, `Text Colour`/`Text Color`, and `Description`.

### Milestones (optional)

| Item | Milestone | Date | Type |
| --- | --- | --- | --- |
| Platform Observability | Metrics baseline | 15/10/2026 | review |

`Item` should match an item title or ID. Type can be `deadline`, `launch`, `review`, or `release`.

### External Dependencies (optional)

| Item | Dependency | Date |
| --- | --- | --- |
| Platform Observability | Vendor credentials | 20/09/2026 |

The viewer renders these as white paper stickers beneath the washi tape.

## No libraries to install

The viewer does not use npm, Vite, React, SheetJS, or another installed JavaScript library on the laptop. It contains a small browser-only `.xlsx` reader and uses the browser's built-in ZIP decompression support.

For this reason, use a current Chrome or Edge browser. If the company browser blocks local file access or `DecompressionStream`, the viewer will show an explanatory error rather than upload the workbook elsewhere.
