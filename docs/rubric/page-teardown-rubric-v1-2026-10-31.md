# Page Teardown Rubric v1

Oct 31, 2026 · Draft with Andrew's six Oct 31 calls folded in. Waiting on Andrew's final approval; not yet approved as v1.0.

This copy supersedes the Oct 29 draft (page-teardown-rubric-v1.md), which is left unchanged. What changed is listed in the Decisions section at the end.

## Status

This is a proposed v1, modelled directly on Inbox Teardown Rubric v1 (Oct 7, 2026), so the three properties share one scoring grammar: eight dimensions, 1 to 5 each, equal weight, total out of 40, bands computed at build time, a hard fail on Trust or Technical Hygiene, a ceiling rule, evidence per score, and `rubric_version` on every record.

It does not change the existing capture job. That job stays what it is: every night, a phone-size screenshot of each brand homepage, exactly as a first-time visitor sees it, with no scoring or commentary in the capture itself. Scoring is a separate layer applied to the screenshot plus its extracted text and link data afterward. Nothing in this rubric authorises a new capture, a new brand list, or a publish step.

Two naming choices follow the Inbox rule that every dimension must apply to every item, so all totals stay out of 40 with no N/A:

- No "Pricing" dimension. Not every homepage leads with price, and a dimension that scores 1 or 2 almost everywhere on editorial or brand homepages would flatten the board.
- No "Personalization" dimension. The capture is a first-time visitor with no login, account, or purchase history, so real personalization cannot be observed. That is why the sixth dimension is Relevance, judged as fit for a first-time visitor, not as personalization.

The Oct 23 project plan also proposed Interruption load and Findability dimensions. This rubric does not carry them. Overlays count only where they hide key copy (see the overlap check below).

## Scoring rules

Each dimension scores 1 to 5 with equal weight, for a total out of 40. Deterministic checks set a ceiling per dimension, and Jev scores at or below it.

- **Scale.** 5 is a reference example other teams should copy. 3 is competent, with nothing notable either way. 1 actively hurts the page. 2 and 4 sit between them and get no separate anchors.
- **Composition.** Dimension score = min(Jev's judgment, the lowest ceiling set by any deterministic check). Every score carries one line of evidence: a quote from the visible page text, a description of what is visible in the screenshot, or the check's output.
- **Bands.** Computed at build time, never stored: Strong 33 to 40, Solid 24 to 32, Weak 8 to 23. A page that scores 3 on every dimension totals 24, the floor of Solid.
- **Hard fail.** A 1 on Trust or Technical Hygiene keeps the total visible and replaces the band with Capped. Only the three checks marked "Forces 1" in the checks table can do this. Every other check only lowers a ceiling.
- **No N/A.** Every dimension applies to every homepage, so all totals compare. A homepage with no visible offer, no price, and no login still gets a score on every dimension below.
- **Versioning.** Every score records `rubric_version` (v1.0 at launch). Later changes bump the version and get a changelog entry on the methodology page. Past scores are never rescored silently.
- **Calibration.** Andrew hand-scores a gold set of 10 real homepages, drawn from screenshots already captured by the nightly job; no new capture is needed to build the gold set. Jev ships when it lands within 1 point of Andrew on at least 90% of the 80 dimension scores, and the gold set reruns after any prompt change.
- **Pre-calibration display (decided Oct 31).** Until Jev passes the gold set, the board shows totals and bands, labelled "rubric v1.0, pre-calibration". When calibration passes, the label comes off and the change is logged on the methodology page; `rubric_version` on every record shows which scores came before it.

## Jev question mapping

Jev is the judge only. Application code owns the state, the weights, the ceilings, and the publish decision.

- **Score, one per dimension.** Eight Score questions in a single request, one per dimension below, with the 1, 3, and 5 anchors as the question criteria. This is the same fan-out pattern as Inbox: one request per homepage, all questions evaluated in parallel against the same state, irrelevant answers ignored by code.
- **Choice, for kind only.** One Choice question for homepage kind (for example brand/storefront, product-led, content/editorial, or other), used to route and to filter the board, never scored. Do not let kind change a dimension weight silently; if a kind needs different weights, that is a rubric version change, not a prompt tweak.
- **Noul, for gates.** Noul questions gate the hard fails and the box check below: for example, "Does the page contradict its own headline offer in its visible text?" A Noul near 0.5 is uncertainty, not a yes; use the starting thresholds of 0.7 for yes and 0.3 for no, and route the middle band to human review.
- **Box, for CTA location only (Jev 1.14).** A `box` question may locate the primary CTA in the phone screenshot, but it always returns a box, so pair it with a Noul presence gate ("Is there a primary CTA visible in the first screen?") before trusting the coordinates. Box output is evidence for the Call to Action dimension; it is not itself a score.
- **State.** The state for each request is: the phone-size screenshot, the visible text extracted from that screenshot in reading order, the primary and secondary CTA labels with their destinations, and deterministic facts (load outcome, link status codes, viewport size). Engagement, traffic, and conversion data are not state for this rubric and are never scored; this board judges craft, not popularity or performance.

## The eight dimensions (names and slugs decided Oct 31)

Dimensions run in the order a first-time visitor meets them, from the top of the phone screen down. Slugs are the stable keys in the content contract, so display names can change later without a schema change.

| Dimension | Question it answers | 5 | 3 | 1 | Scored by |
| --- | --- | --- | --- | --- | --- |
| Headline (`headline`) | Does the first screen say what this is and for whom, within 3 seconds? | One specific headline: what it is, for whom, and why it matters, in the first screen | Clear but generic ("Welcome to X", "Shop the collection") | No discernible headline, or the headline contradicts what the page below actually sells | Jev |
| Value & Differentiation (`value`) | Is the benefit specific and recognizably this brand, not any competitor? | A concrete benefit or difference a visitor could repeat back, supported on the page | Plausible benefit, but interchangeable with a competitor | Vague superlatives only ("best", "premium", "amazing"), or a benefit the page itself does not support | Jev |
| Design & Hierarchy (`hierarchy`) | Does the layout lead the eye to the one thing that matters, on a phone? | Clear hierarchy at 375px; one dominant element; key copy is live text; holds up without horizontal scrolling | Works on mobile; stacked sections of equal weight, but nothing broken | Broken on mobile, image-only hero with key text baked into the image and unreadable, or competing elements of equal dominance | Jev, with check ceilings |
| Copy & Voice (`copy`) | Is the writing specific and recognizably this brand? | Distinct voice, concrete claims, no filler | Correct and on-brand, but interchangeable with a competitor | Boilerplate, confirmed typos, or tone at odds with the brand | Jev, with check ceilings |
| Call to Action (`cta`) | Is there one obvious next step? | One verb-led, specific primary CTA in the first screen, landing on the matching page | Present but generic ("Shop now", "Learn more") or one of several equals | No clear CTA, or it lands on a page unrelated to the headline offer | Jev, with check ceilings |
| Relevance (`relevance`) | Does the page fit a first-time visitor who knows nothing about the brand? | Speaks to a newcomer: context, entry point, and next step are all present without assuming prior purchase or login | Suitable for a newcomer, but assumes some familiarity or buries the entry point | Assumes login, membership, or prior purchase ("Welcome back", members-only framing with no newcomer path), or shows a locale/currency mismatch for the visitor | Jev |
| Trust (`trust`) | Is the page honest about who it is and what is on offer? | Consistent brand, real terms, contact or help path visible, no manufactured urgency, claims match the page below | Compliant, with mild pressure (a generic sale banner) | Deceptive headline prefix or claim, or a claim the page itself contradicts. A missing contact, help, or terms path caps Trust at 2 rather than scoring 1 (see checks) | Checks force 1s; Jev judges the rest |
| Technical Hygiene (`hygiene`) | Does the page load intact, work, and stay readable? | Loads fully at phone size, every checked link resolves, text is readable, no broken layout or overlapping elements | Minor issues: a secondary link unverified, a non-critical image slow or missing | Page fails to load, primary CTA link broken (404, 410, 5xx), or layout broken so key content is unreadable | Checks, Jev only on readability and typos |

A broken CTA link counts once, under Technical Hygiene. Call to Action judges the CTA as written and placed, so one defect never costs two dimensions. The same rule as Inbox: a defect is charged to exactly one dimension.

## Deterministic checks

Three checks can force a 1 and cap a page. Everything else lowers a ceiling or is reported without scoring. Checks run at scoring time, against the same capture the screenshot came from, not against a later live page that may have changed.

| Check | Dimension | Effect | Notes |
| --- | --- | --- | --- |
| Page fails to load or returns 5xx at capture/scoring time | Hygiene | Forces 1 | Retry once before forcing; a transient failure is "unverified", not a fail |
| Primary CTA link returns 404, 410, or 5xx | Hygiene | Forces 1 | Two attempts, real browser user agent; 403, 429, and timeouts are "unverified" with no penalty |
| Headline or primary CTA text contradicts the destination page's own headline or offer | Trust | Forces 1 | Only when the contradiction is in the page's own text, not inferred from a third-party source |
| No contact, help, or terms path findable from the homepage | Trust | Max 2 | Decided Oct 31: a ceiling, not a forced 1. The nightly capture is first screen only, so a footer link cannot be confirmed from the screenshot. A footer link counts; it need not be in the first screen. Revisit as a forced 1 in a later version once the footer-as-image trap is handled |
| Secondary link returns 404, 410, or 5xx | Hygiene | Max 3 | 403, 429, and timeouts are "unverified" with no penalty |
| Key hero text is image-only (no live text equivalent) | Hierarchy, Hygiene | Max 2, Max 3 | Image-only hero |
| Over half of content images lack alt text | Hygiene | Max 3 | |
| Horizontal scrolling required at 375px, or an overlapping element (overlay, banner, sticky bar) hides key copy: the headline, the value line, or the primary CTA | Hierarchy | Max 2 | Decided Oct 31: an overlap that hides no key copy does not set this ceiling. From the screenshot, confirmed by Jev; a check alone does not force this |
| Confirmed typos (spellcheck flag, brand dictionary, Jev confirms) | Copy | 1 typo max 4, 2+ max 3 | |
| No visible offer terms where a headline offer is made (amount, minimum, expiry, or "see details") | Value | Max 2 | Report only if no offer is made at all; then this check does not apply |
| Link host differs from the brand domain | Trust | Report only | Compare registrable domains, not subdomains. Scored (max 2) only when visible link text names one brand and the resolved destination belongs to an unrelated company. ESP, CDN, payment, and tracking hosts are benign unless that test is met |
| Load time, third-party tracker count, analytics tags | none | Report only | Invisible to the visitor or a performance signal, not a craft-quality signal on this board |

### What to watch for, learned from Inbox

Inbox v1 had to be rewritten because its first run hard-failed 17 of 19 sends on checks that did not survive an evidence pull: subdomain comparisons flagged the brand's own domains and ESP hosts, extensionless tracking pixels were checked as links, and image-based footers were read as missing addresses. Page has the same traps, in page form:

- Compare registrable domains, not full hosts, and skip known tracking-pixel and CDN patterns before checking a link.
- Treat 403, 429, and timeouts as unverified, never as broken.
- Treat "not found in the extracted text" as unverified until the screenshot itself has been checked; a footer or legal block may be rendered as an image.
- Show unique triggers with a count, not one row per instance, and truncate long headlines with an ellipsis.

## Board and methodology page (decided Oct 31)

- **Launch scope.** The board shows all 58 brands at launch. Brands without a usable capture that night sit in a Not captured section with the reason in public-safe wording, rather than being dropped.
- **Filters, not lanes.** The board filters by vertical and by homepage kind (the Choice answer). There is no Page analogue of Inbox's Welcome-style lanes.
- **Corrections.** The methodology page commits to replying to a correction request within 2 business days and fixing a confirmed error within 7 days. A corrected score is logged, never changed silently.

## Content contract

Emit one JSON record per homepage, in the same shape as the Inbox contract, so a future site build can consume all three properties the same way:

brand, capture date, homepage kind (Choice answer), eight dimension scores keyed by slug, each with its evidence line and ceiling-setting check if any, check results, `rubric_version: "v1.0"`, screenshot URL from the public store. No band; the site build computes it from the total and the hard-fail flag. Screenshots go to their own public store from the first real scoreboard PR, never into git; the content contract carries a URL. Keep the full record (every check result with evidence, every dimension score with `rubric_version`) as append-only JSONL on the agent host until a database build exists, shaped like the future tables so that build is a bulk load.

## Decisions and next steps

Andrew's calls on the Oct 29 checklist, made Oct 31, 2026:

- [x] Eight names and slugs approved as written, including Value & Differentiation and Relevance for a first-time visitor
- [x] "No contact/help/terms path" is a Trust ceiling of 2, not a forced 1, until the footer-as-image trap is handled
- [x] Readability ceiling: Hierarchy max 2 only when an overlap hides key copy (headline, value line, or primary CTA), not for any single overlapping element
- [x] Pre-calibration display: totals shown, board labelled "rubric v1.0, pre-calibration" until Jev passes the gold set
- [x] Correction response time: reply within 2 business days, fix within 7 days
- [x] Launch with all 58 brands plus a Not captured section; filter by vertical and homepage kind; no Welcome-style lanes

Still open: Andrew's approval of this document as rubric v1.0.

Then, in order:

1. Andrew: hand-score the 10-page gold set from already-captured screenshots.
2. Agent host: implement the v1 checks table, the ceiling rule, evidence per score, and `rubric_version`; score one page end to end first and diff it against Andrew's hand score before batching the rest.
3. Agent host: emit one JSON record per homepage in the content-contract shape above.
4. Site repo: methodology page PR with the dimensions, anchors, checks, board scope, and correction commitment, replacing any TODOs; add `rubric_version` to the content contract.
