# Drupal API Integration — Data Dictionary & JSON Format

**Date:** 2026-05-06  
**Status:** Approved  
**Context:** WWYS app submits session results to a Drupal portal webform via REST API. Results are later retrieved as raw JSON for community insights display.

---

## Overview

At the end of each game session the app POSTs a single JSON payload to a Drupal webform REST endpoint. The app also GETs all raw submissions from a Drupal View endpoint to power the community insights dashboard.

No pre-aggregation is done server-side — all calculations (miss rate, leaderboard, total sessions) are handled on the frontend.

---

## Part 1: Submitting Results (POST)

### Endpoint (provided by Dan's team)
```
POST https://[portal-url]/webform_rest/submit
```

### Authentication
CSRF token flow — app pings `https://[portal-url]/session/token` first, includes token in request header. Users are already logged into the Drupal portal (session auth).

### Trigger
Single submission at session end (last card swiped). Never mid-session.

---

### Data Dictionary

#### Session fields

| Field key | Drupal type | Allowed values | Notes |
|---|---|---|---|
| `webform_id` | — | `"wwys_results"` | Required by Drupal REST API |
| `username` | text | any string | Entered on attract screen, required |
| `email` | text | any string or `""` | Empty string if player skipped |
| `submitted_at` | text | ISO 8601 UTC e.g. `"2026-06-04T14:32:10Z"` | `new Date().toISOString()` at session end |
| `score` | integer | 0–1800 | `cards_correct × 100 + max_streak × 50` |
| `cards_correct` | integer | 0–12 | Count of correct swipes |
| `cards_total` | integer | `12` | Always 12 — all cards always shown |
| `max_streak` | integer | 0–12 | Longest consecutive correct run |

#### Per-card fields (×12)

Keyed by **profile ID**, not deck position. The deck is shuffled each session but `card_p4_correct` always refers to profile p4 regardless of when it appeared.

| Field key | Drupal type | Allowed values |
|---|---|---|
| `card_p1_correct` | text | `"yes"` \| `"no"` |
| `card_p2_correct` | text | `"yes"` \| `"no"` |
| `card_p3_correct` | text | `"yes"` \| `"no"` |
| `card_p4_correct` | text | `"yes"` \| `"no"` |
| `card_p5_correct` | text | `"yes"` \| `"no"` |
| `card_p6_correct` | text | `"yes"` \| `"no"` |
| `card_p7_correct` | text | `"yes"` \| `"no"` |
| `card_p8_correct` | text | `"yes"` \| `"no"` |
| `card_p9_correct` | text | `"yes"` \| `"no"` |
| `card_p10_correct` | text | `"yes"` \| `"no"` |
| `card_p11_correct` | text | `"yes"` \| `"no"` |
| `card_p12_correct` | text | `"yes"` \| `"no"` |

**Note on swipe direction:** Not submitted. Since each profile's `correctAction` is known (`"screen"` or `"monitor"`), swipe direction is fully derivable:
- `correct = "yes"` → player swiped `correctAction`
- `correct = "no"` → player swiped the opposite

---

### Sample POST payload

```json
{
  "webform_id": "wwys_results",
  "username": "DrSmith",
  "email": "drsmith@clinic.org",
  "submitted_at": "2026-06-04T14:32:10Z",
  "score": 1350,
  "cards_correct": 9,
  "cards_total": 12,
  "max_streak": 5,
  "card_p1_correct": "yes",
  "card_p2_correct": "yes",
  "card_p3_correct": "yes",
  "card_p4_correct": "no",
  "card_p5_correct": "yes",
  "card_p6_correct": "yes",
  "card_p7_correct": "no",
  "card_p8_correct": "yes",
  "card_p9_correct": "yes",
  "card_p10_correct": "yes",
  "card_p11_correct": "yes",
  "card_p12_correct": "no"
}
```

---

## Part 2: Retrieving Results (GET)

### Approach
Dan's team exposes all webform submissions as a raw JSON array via a Drupal View. No server-side aggregation. The app fetches all rows and computes what it needs.

### Endpoint (provided by Dan's team)
```
GET https://[portal-url]/api/wwys-submissions
```

### What the app computes from the raw data
- **Per-card miss rate** — `count(card_pX_correct === "no") / submissions.length` for each profile
- **Most missed cards** — ranked by miss rate for Scientific Council insights
- **Total sessions played** — `submissions.length`
- **Community leaderboard** — sort by `score` descending

### Sample GET response

```json
[
  {
    "username": "DrSmith",
    "email": "drsmith@clinic.org",
    "submitted_at": "2026-06-04T14:32:10Z",
    "score": 1350,
    "cards_correct": 9,
    "cards_total": 12,
    "max_streak": 5,
    "card_p1_correct": "yes",
    "card_p2_correct": "yes",
    "card_p3_correct": "yes",
    "card_p4_correct": "no",
    "card_p5_correct": "yes",
    "card_p6_correct": "yes",
    "card_p7_correct": "no",
    "card_p8_correct": "yes",
    "card_p9_correct": "yes",
    "card_p10_correct": "yes",
    "card_p11_correct": "yes",
    "card_p12_correct": "no"
  },
  {
    "username": "DrLee",
    "email": "",
    "submitted_at": "2026-06-04T15:10:44Z",
    "score": 1200,
    "cards_correct": 8,
    "cards_total": 12,
    "max_streak": 4,
    "card_p1_correct": "yes",
    "card_p2_correct": "no",
    "card_p3_correct": "yes",
    "card_p4_correct": "no",
    "card_p5_correct": "yes",
    "card_p6_correct": "yes",
    "card_p7_correct": "yes",
    "card_p8_correct": "no",
    "card_p9_correct": "yes",
    "card_p10_correct": "yes",
    "card_p11_correct": "yes",
    "card_p12_correct": "yes"
  }
]
```

---

## What Dan's team needs from us
1. This data dictionary (field keys + allowed values)
2. Confirmation that `cards_total` is always 12

## What we need from Dan's team
1. POST endpoint URL + webform_id confirmation
2. GET endpoint URL + sample JSON response
3. CSRF token endpoint URL
4. Field machine names if they differ from our proposed keys
