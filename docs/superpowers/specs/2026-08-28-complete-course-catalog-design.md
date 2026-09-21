# Complete Course Catalog Design

## Document contract

Purpose: Preserve the historical design, plan or verification record below.
Read this when: Investigating the original intent or evidence for this change; this is not the current operational runbook.
Update this when: Correcting this historical record or adding a supersession reference. Preserve its original context.
Primary sources of truth: The artifacts cited below for historical claims; current implementation, tests and later migrations for current behavior. Start with [current architecture](../../ARCHITECTURE.md) and [known issues](../../KNOWN_ISSUES.md).

## Goal

Load the supplied BRAC University workbook into one duplicate-safe global catalog while keeping the student Course List limited to the supplied CS degree plan. Students can still find and add any other catalog course through Add Course search.

## Authoritative Sources

- `C:/Users/SK Reyad Ali/Desktop/BRAC_University_Undergraduate_Courses_Formatted.xlsx` supplies the 13 academic units and 989 source rows (956 unique normalized course codes).
- `C:/Users/SK Reyad Ali/Desktop/Updated_Degree_Plan_CS.pdf` supplies 93 CS curriculum codes and their curriculum categories for default student visibility. Nine of those codes are absent from the workbook and are added as PDF-only catalog rows.
- Existing catalog data supplies authoritative user/admin edits, credits, prerequisites, roadmap positions, and faculty data; importing never creates a second row with the same normalized course code.

## Catalog Identity and Duplicate Policy

- Department identity is a compact uppercase academic-unit ID.
- Course identity is a compact uppercase course code.
- Duplicate workbook rows are collapsed to one course. When both an owning academic unit and SGE list the same code, the owning unit is primary and the SGE stream is curriculum metadata.
- Database seeds use the primary key and conflict-safe inserts. Existing titles, credits, prerequisites, roadmap fields, and source notes are not overwritten by workbook data.
- A separate metadata update may change only `visibility` and `category` so an existing row follows the approved PDF-vs-search behavior without becoming a duplicate.

## Visibility Model

- `curriculum`: the course is in the CS degree plan and appears automatically in Student Course List.
- `search_only`: the course remains outside the default Course List and appears in Add Course search.
- Admin UI calls `search_only` **Add Course only**. Student UI never displays the technical `search_only` or “Search-only catalog” wording.
- A student who adds a search-only course receives a user-owned copy in `state.courses`; it then appears normally in that student's Course List.
- Existing user-owned courses always remain visible and win conflicts over global data.

## Credits

- Workbook-only courses have nullable credits because the workbook does not provide credits.
- Existing known credits are preserved.
- When a student adds a course whose credits are unknown, Add Course asks for credits before saving it to the student's list. The system never assumes three credits.

## Admin Experience

- Global Catalog retains Departments, Courses, and Faculty tabs.
- Courses include search, Department, Category, and Student visibility filters.
- Course rows display `Visible in Course List` or `Add Course only` to administrators.
- Course Category is a friendly dropdown with `Custom category…`; the stored value is a lowercase hyphenated key.
- Edge Function errors are parsed and displayed as the server validation message instead of the generic non-2xx SDK message.

## Student Experience

- Course List keeps its existing layout, status filter, department filter, edit, and remove controls.
- Default global rows are limited to `curriculum`; user-owned additions remain.
- Add Course opens a searchable catalog picker across the 956 unique workbook courses plus nine PDF-only curriculum codes (965 unique source codes before conflicts) and supports a department filter.
- Results show code, title, department, credits (or `Credits not set`), and whether the course is already added. Search-only implementation status is not shown.

## Database and Security

- Migration 020 expands `catalog_courses` with `visibility` and makes credits nullable. Existing rows default to `curriculum` for backward compatibility.
- Migration 021 seeds units and courses separately from the schema migration.
- Authenticated clients retain read-only catalog access. All Admin mutations continue through the AAL2-protected, rate-limited, audited `admin-access` Edge Function.
- Public payload allowlists include only the new visibility field; server validation accepts only `curriculum` and `search_only`.

## Verification

- Generator tests prove normalized-code deduplication, owning-unit precedence, no invented credits, and curriculum visibility overrides.
- Catalog tests prove search-only rows do not flood Course List, all rows remain searchable, user data wins, and adding an unknown-credit course requires credits.
- Admin tests prove friendly category conversion, visibility filtering/copy, and real Edge error extraction.
- Migration tests prove conflict-safe seeding, expected counts, read-only client permissions, and forward-only schema changes.
