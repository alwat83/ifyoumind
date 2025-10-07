# Analytics Event Naming & Conventions

This document defines the event taxonomy for the application and guidelines for adding new analytics events.

## Goals
- Provide consistent, query-friendly event names
- Capture meaningful engagement, quality, and failure signals
- Avoid PII and sensitive data in event payloads
- Keep payloads small (< 25 key/value pairs; we use far fewer)

## Naming Conventions
- snake_case for event names (Firebase recommendation compatible)
- Always include stable identifiers with explicit suffixes: `idea_id`, `comment_id`, `category`.
- Past-tense or action-completed wording (e.g. `idea_created`, `comment_added`).
- Generic meta event for failures: `action_failed` with `action` parameter.
- Dwell / timing events use suffix `_dwell` or param `*_ms` for milliseconds.

## Current Events
| Event | When Fired | Params |
|-------|------------|--------|
| page_view | On every route navigation end | `page_path` |
| page_dwell | On navigation away or unload for previous page | `page_path`, `dwell_ms`, `terminal?` |
| idea_created | After successful idea creation | `idea_id`, `category` |
| idea_upvoted | After successful upvote (only when adding, not removal) | `idea_id` |
| idea_bookmarked | After user bookmarks (not on un-bookmark) | `idea_id` |
| idea_shared | After share (native share or copy) | `idea_id`, `method` (`web_share` | `clipboard`) |
| comment_added | After new comment submitted | `idea_id` |
| action_failed | On any tracked failure scenario | `action`, `reason?`, (plus contextual IDs) |

## Failure Actions (action_failed:action)
| Action | Scenario | Context Params |
|--------|----------|----------------|
| upvote | Callable upvote toggle failed | `idea_id` |
| bookmark_toggle | Bookmark toggle failed | `idea_id` |
| share_copy | Copy link failed | `idea_id` |
| idea_create | Idea creation threw error | *(none mandatory)* |
| comment_update | Edit comment failed | `idea_id`, `comment_id` |
| comment_delete | Delete comment failed | `idea_id`, `comment_id` |

(We intentionally do not log comment add failure yet to avoid excessive noise; can add if needed.)

## Adding a New Event
1. Decide if it fits an existing generic (`action_failed`) or needs a new specific event.
2. Follow naming conventions: short, descriptive, snake_case.
3. Only include primitive serializable params (string, number, boolean).
4. Avoid user PII: no emails, display names, or free-form text content.
5. Update this `ANALYTICS.md` table.
6. Add helper method in `AnalyticsService` if it’s a recurring pattern.

## Dwell Time Notes
`page_dwell` fires:
- On each route navigation (for the page the user is leaving)
- On `beforeunload` with `terminal: true` for last page.
Client clock skew is acceptable for relative session analysis.

## Query Tips (BigQuery / GA4 Explorations)
- Filter out `dwell_ms < 300` to remove accidental bounces.
- Funnel: `page_view` -> `idea_created` to measure conversion.
- Failure ratio per feature: count(action_failed where action = X) / count(success event for X).

## Future Candidates
| Candidate | Rationale |
|-----------|-----------|
| profile_updated | Track profile improvements adoption |
| image_upload_failed (action_failed) | Media quality + error trends |
| onboarding_completed | Later onboarding funnel metrics |
| search_performed | Understand discovery behavior |

## Do & Don't Quick Reference
- DO keep events immutable once shipped; add new events instead of repurposing.
- DO log only after confirmed success (e.g., after promise resolves).
- DON'T include arrays of IDs; log one entity per event.
- DON'T log raw error objects; only concise `reason` strings.

## Example Implementation Snippet
```ts
try {
  await this.bookmarkService.toggle(idea.id);
  this.analytics.ideaBookmarked(idea.id);
} catch (e: any) {
  this.analytics.actionFailed('bookmark_toggle', e?.message, { idea_id: idea.id });
}
```

---
Last updated: 2025-10-07
