# Testing

| Layer | Tool | Required for |
|---|---|---|
| Schemas | Vitest | Every schema in `packages/contracts` has a valid and an invalid fixture test |
| API | Vitest + Supertest | Every route: happy path, auth failure, cross-firm access denied |
| Web | Playwright | Each ported view: renders seeded data; key actions work |
| Visual | Playwright screenshots | Port vs prototype at 1440 px and 390 px, dark and light |
| Privacy | Custom suite | See PRIVACY_MODEL "Privacy tests" (stage 4+) |
| Matching | Eval harness | Accuracy and calibration per band (stage 5) |

Tests for auth, encryption, key handling and payments are written **before** the implementation.
