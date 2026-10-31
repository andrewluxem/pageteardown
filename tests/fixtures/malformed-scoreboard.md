---
# Deliberately broken. Lives outside src/content and tests/fixtures/scoreboard
# so it never reaches a build.
date: 2026-10-30
generated_at: 2026-10-31T13:00:00Z
rubric_version: 1.0               # unquoted: YAML reads a number
pages:
  - id: 2026-10-30-broken-brand-home
    brand: "Broken Brand (placeholder)"
    brand_slug: broken-brand
    vertical: crypto              # not one of the 8 verticals
    homepage_kind: storefront
    url: https://www.broken-brand.example/
    captured_at: 2026-10-31T04:20:00Z
    hero_headline: "Seven dimensions and a six"
    primary_cta: { text: "Shop now" }
    dimensions:                   # hygiene is missing (7 dimensions)
      headline:  { score: 3, note: "n", source: judgment }
      value:     { score: 3, note: "n", source: judgment }
      hierarchy: { score: 3, note: "n", source: judgment }
      copy:      { score: 3, note: "n", source: judgment }
      cta:       { score: 6, note: "out of range", source: judgment }
      relevance: { score: 3, note: "n", source: judgment }
      trust:     { score: 3, note: "n", source: both }
    checks: []
    screenshot: null
    subject: "An email field"     # unknown key
---
