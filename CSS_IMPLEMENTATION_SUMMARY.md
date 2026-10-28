# CSS Implementation Review

The frontend uses regular CSS stylesheets bundled by Vite. Shared styles provide the design foundation, while feature stylesheets add layouts and states for individual parts of the job portal. These are global CSS files, not CSS Modules, and Tailwind is not part of the frontend package.

## Shared design system

`job-portal-frontend/src/styles/variables.css` defines the core design tokens:

| Token | Use |
| --- | --- |
| `--bg`, `--surface` | Page and card backgrounds |
| `--ink`, `--ink-muted` | Primary and secondary text |
| `--border` | Borders and separators |
| `--accent`, `--accent-dark`, `--gold` | Brand and emphasis colors |
| `--success`, `--success-bg` | Success states |
| `--danger`, `--danger-bg` | Error and destructive states |
| `--pending-bg`, `--pending-ink` | Pending states |
| `--font-body`, `--font-display` | Body and heading typefaces |

`styles-index.css`, imported by `src/main.tsx`, brings in the shared styles for the site foundation, layout, utilities, buttons, forms, navigation, hero, footer, job pages, dashboards, applications, authentication, content pages, admin screens, and advertisements.

## Feature stylesheets

| Stylesheet | Current purpose |
| --- | --- |
| `JobAlerts.css` | Alert form, keyword tags, job-type controls, alert cards, active/paused states, and actions |
| `SavedJobs.css` | Saved-job cards, job metadata, remove action, and view/apply actions |
| `Interviews.css` | Candidate and employer interview cards, filters, status, meeting details, notes, and feedback |
| `EmployerInterviews.css` | Interview scheduling dialog and employer applicant/interview actions |
| `Bookmark.css` | Bookmark controls and related job-card actions |


The page/component files import these feature stylesheets directly. The shared stylesheet index does not import every feature stylesheet.

## Responsive behavior and interaction styles

- `JobAlerts.css` adjusts its layout at 768px and below.
- `SavedJobs.css` and `Interviews.css` include 768px and 480px breakpoints.
- `EmployerInterviews.css` includes a 560px breakpoint.
- Several controls and cards define hover, focus, active, disabled, or status styles. Loading indicators use spinner animation rules in the feature stylesheets.

These breakpoints describe the listed feature stylesheets; other pages use the responsive rules in their own shared or page-level CSS files.

## Review notes

- The feature styles are plain global CSS. Selectors such as `.loading-container` and `.spinner` are declared in more than one feature stylesheet, and names like `.filter-tabs`, `.empty-state`, `.job-logo`, and `.form-group` are broad enough to overlap with other screens. Scope new selectors beneath the page root (for example, `.job-alerts-page .filter-tabs`) or use feature-prefixed class names to reduce accidental cascade changes.
- The current naming is mixed: page-prefixed names such as `.saved-jobs-page` sit alongside generic names such as `.job-title`. Follow the page-root prefix when adding styles; this fits the existing plain-CSS setup without requiring a tooling change.
- Earlier bundle-size, gzip, and build-success figures described a past build and are not a current verification of this checkout, so they have been removed. Run a fresh frontend build before publishing new size numbers.
- The styles do not provide a separate light/dark theme system. They use one token set declared in `variables.css`.

## Adding or updating styles

1. Reuse the variables in `variables.css` for shared colors and typography.
2. Put page-specific rules in a stylesheet under `src/styles/` and import it from the page or component that owns those styles.
3. Scope selectors under the page or component root to avoid global name collisions.
4. Add responsive rules at the widths where the layout needs to change.
5. Include interaction states for controls, including visible keyboard focus where appropriate.
