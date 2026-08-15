# Approved project image derivatives

These files are metadata-stripped, responsive derivatives of four approved launch screenshots. No raw screenshot is served.

| Public-safe source label            | Public output family                                 | Visible feature                            |
| ----------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Approved Dive location capture      | `dive/hospital-map-{480,768,1110}.{avif,webp}`       | Map-based nearby-hospital discovery        |
| Approved Dive emergency capture     | `dive/emergency-actions-{480,768,1110}.{avif,webp}`  | Accident reporting and emergency actions   |
| Approved Dostava restaurant capture | `dostava/restaurant-list-{480,768,1110}.{avif,webp}` | Restaurant discovery within the order flow |
| Approved Dostava produce capture    | `dostava/produce-order-{480,768,1110}.{avif,webp}`   | Free-form produce ordering workflow        |

Regenerate these outputs with `npm run assets:images --` and the four named source arguments documented by `scripts/optimize-project-images.ts`. Source locations are intentionally not stored in public files.
