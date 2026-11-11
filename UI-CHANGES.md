# UI refresh

This project uses the more complete `gpt/Vendor` version from the original ZIP, including the Exception desk and expanded analytics.

## Dynamic visual upgrade

- Bundled workspace and logistics photography with responsive crops.
- A live portfolio donut and approval summary derived from saved case data.
- Visual shortcuts to the review queue, exception desk, and Analyst Copilot.
- Page transitions, scroll reveals, hover feedback, and animated chart updates.
- Reduced-motion support disables these animations.
- Updated cool teal, blue, and warm accent palette in light and dark themes.

## What changed

- A consistent teal, white, and warm-neutral visual system across all seven workspaces.
- Simplified navigation with a compact tablet rail and a mobile top navigation bar.
- A redesigned overview with a workflow illustration, clearer portfolio metrics, priority actions, and recent activity.
- More readable forms, document uploads, tables, reports, and empty states.
- Queue search across vendor names, countries, and run IDs, plus status filters and a reset action.
- Updated night mode, keyboard focus styling, a skip link, and reduced-motion support.
- Meaningful page titles and active navigation announcements.

The original Python backend, rule engine, example packets, case storage, and document-processing workflow are retained. No new dependency is required.

## Run

1. Extract this folder.
2. Open a terminal in the extracted folder.
3. Run `python -m pip install -r requirements.txt`.
4. Run `python server.py`.
5. Open http://127.0.0.1:8000.

Use `py` instead of `python` if that is your Python command on Windows. See README.md for the existing workflow and demo documentation.

## Verification

Checked all seven views in Chromium at desktop and mobile sizes; queue search, filters, no-match/reset state, case reports, and saved theme preference. Tested PDF intake, all six field suggestions, supporting document uploads, extraction, checks, comparison, approval, follow-up recording, finalization, and persistence after reload. Screenshots show the supplied fictional demo portfolio.
