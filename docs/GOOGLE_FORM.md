# Google Form — Level 5 feedback

Rise In requires a **Google Form** + **public Excel/CSV sheet** linked from the README.

## Create the form (~3 minutes)

1. Open https://forms.google.com → **Blank**.
2. Title: `Midnight Casino — Preprod Feedback (Rise In L5)`.
3. Description:

```
Thanks for trying Midnight Casino on Midnight Preprod.
Play: https://midnight-casino-eta.vercel.app/game/privacy-wheel
Contract: 33d34f168e360498df9b9e08baca1c999cdf50e61642f8af2888eaed7ec4be92
```

4. Add these questions (exact order):

| # | Question | Type | Required |
|---|----------|------|----------|
| 1 | Name | Short answer | Yes |
| 2 | Email | Short answer | Yes |
| 3 | Wallet Address (Lace / 1AM Preprod) | Short answer | Yes |
| 4 | Product Rating (1–5) | Linear scale 1–5 | Yes |
| 5 | Which feature did you like the most? | Paragraph | Yes |
| 6 | What feature do you think is missing? | Paragraph | Yes |
| 7 | Did you encounter any bugs or UX friction? | Paragraph | Yes |
| 8 | Would you recommend this product? (Why / why not) | Paragraph | No |

Questions 5–7 satisfy the **≥3 additional feedback questions** rule.

5. Settings → Responses → link to a new Google Sheet.
6. Sheet → **Share** → Anyone with the link → Viewer.
7. Form → **Send** → copy link.
8. Paste both URLs into README (**Google Form** / **Feedback sheet** rows).

## In-app mirror

Until the Google Form is live, collect via https://midnight-casino-eta.vercel.app/feedback — same fields. Export CSV and merge into [`feedback-sheet.csv`](feedback-sheet.csv).

## After export

1. Download Sheet as `.xlsx` or keep CSV in-repo.
2. Sync rows into [`USERS.md`](../USERS.md) (Name, Email, Wallet, Feedback Summary).
3. Pick improvements → ship commits → fill **Feedback Implementation** table with commit IDs.
