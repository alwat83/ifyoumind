# City input: proposal (design only, not in the trust-fix PR)

**Status:** design proposal, awaiting founder approval. Nothing here is built.

## Problem (verified)
- `/app/decide` step 1 asks for a main city and up to three comparison places in one free-text field,
  separated by semicolons (`decision-steps.ts` → `parseComparisons`).
- On a phone the semicolon is on the second keyboard layer.
- Nothing validates a place until the server looks it up in the Census place list after submit.
  A typo costs one of the visitor's 3 free decisions a month only if creation succeeds; a failed lookup
  returns an error after the wait.

## Proposal
1. **One field per place.**
   - "Your city" first, then "Compare with", then "+ Add another place" (up to 3 comparisons).
   - The free brief uses the first comparison; the copy keeps saying so.
2. **Suggestions while typing.** These come from the Census place names the server already fetches for each state (`fetchPlaceRows`), served by a small read-only callable:
   - cached per state;
   - no new data source;
   - no third-party geocoder, because a geocoder adds cost, licensing and privacy questions.
3. **Validation before submit.**
   - An unknown place shows "We couldn't find that city in the Census list. Check the spelling, or try the nearest city," with suggestions.
   - A duplicate place is refused inline.
4. **Phone details:**
   - `inputmode="text"`, `autocomplete="address-level2"`, and a 48 px tap target for each suggestion;
   - no horizontal scrolling;
   - the suggestion list is announced to screen readers (`role="listbox"`).
5. **Compatibility.**
   - The saved decision format is unchanged: still `location` plus `comparisonLocations[]`.
   - `parseComparisons` stays for old links.

## Effort and test
- **Effort:** about 2 days, including the suggestion callable, its rate limit, and tests.
- **Test:** in study task T2, phone participants reach a result with no hints at the city step; the place-lookup error rate in function logs falls.
- **Why it's separate from the trust-fix PR:** it adds a callable and a new interaction pattern, so it gets its own review and release.
