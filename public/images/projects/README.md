# Approved project image derivatives

These files are metadata-stripped, responsive derivatives of approved in-app screenshots from four shipped projects. No raw screenshot is served, and no image with a real person's name, email, face, or other identifying detail is published here.

## Dive

| Public-safe source label                  | Public output family                                | Visible feature                                   |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| Approved Dive sign-in capture             | `dive/login-{480,768,1110}.{avif,webp}`             | Email/Google sign-in                              |
| Approved Dive home capture                | `dive/home-{480,768,1110}.{avif,webp}`              | Diving tips and Egyptian dive-site guide          |
| Approved Dive weather capture             | `dive/weather-{480,768,1110}.{avif,webp}`           | Live conditions and forecast                      |
| Approved Dive MOD calculator capture      | `dive/mod-calculator-{480,768,1110}.{avif,webp}`    | Maximum operating depth calculator                |
| Approved Dive eRDPML pressure capture     | `dive/erdpml-pressure-{480,768,1110}.{avif,webp}`   | RDP pressure-group calculation                    |
| Approved Dive eRDPML warning capture      | `dive/erdpml-warning-{480,768,1110}.{avif,webp}`    | No-decompression-limit warning                    |
| Approved Dive AI Simulation input capture | `dive/sim-input-{480,768,1110}.{avif,webp}`         | Safety-check input form                           |
| Approved Dive safe-result capture         | `dive/safe-result-{480,768,1110}.{avif,webp}`       | "The dive is safe." verdict                       |
| Approved Dive unsafe-result capture       | `dive/unsafe-result-{480,768,1110}.{avif,webp}`     | "The dive is not safe." + recommend action        |
| Approved Dive safer-plan capture          | `dive/safer-plan-{480,768,1110}.{avif,webp}`        | Suggested safer dive from the recommendation loop |
| Approved Dive location capture            | `dive/hospital-map-{480,768,1110}.{avif,webp}`      | Map-based nearby-hospital discovery               |
| Approved Dive emergency capture           | `dive/emergency-actions-{480,768,1110}.{avif,webp}` | Accident reporting and emergency actions          |

## Dostava

| Public-safe source label                | Public output family                                   | Visible feature                                                                   |
| --------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Approved Dostava splash capture         | `dostava/splash-{480,768,1110}.{avif,webp}`            | App splash screen                                                                 |
| Approved Dostava category-menu capture  | `dostava/category-menu-{480,768,1110}.{avif,webp}`     | Circular category menu                                                            |
| Approved Dostava restaurant capture     | `dostava/restaurant-list-{480,768,1110}.{avif,webp}`   | Restaurant discovery within the order flow                                        |
| Approved Dostava supermarket capture    | `dostava/supermarket-order-{480,768,1110}.{avif,webp}` | Free-form supermarket ordering workflow                                           |
| Approved Dostava meat & chicken capture | `dostava/meat-order-{480,768,1110}.{avif,webp}`        | Free-form meat & chicken ordering workflow                                        |
| Approved Dostava produce capture        | `dostava/produce-order-{480,768,1110}.{avif,webp}`     | Free-form produce ordering workflow                                               |
| Approved Dostava order-status capture   | `dostava/order-status-{480,768,1110}.{avif,webp}`      | Order status list, with customer name and delivery area blurred before publishing |

## Mind's Eye

| Public-safe source label                     | Public output family                            | Visible feature                                         |
| -------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Approved Mind's Eye login capture            | `minds-eye/login-{480,761}.{avif,webp}`         | Email/password sign-in                                  |
| Approved Mind's Eye home capture             | `minds-eye/home-{480,759}.{avif,webp}`          | Alzheimer / Visually Impaired mode choice               |
| Approved Mind's Eye feature-menu capture     | `minds-eye/vi-menu-{480,761}.{avif,webp}`       | Visually Impaired mode's six recognition features       |
| Approved Mind's Eye face-recognition capture | `minds-eye/face-start-{480,769}.{avif,webp}`    | Face Recognition feature start screen                   |
| Approved Mind's Eye action-dialog capture    | `minds-eye/select-action-{480,759}.{avif,webp}` | "Select Action" take-photo / choose-from-gallery dialog |

## The Death Ninja

| Public-safe source label               | Public output family                             | Visible feature                                      |
| -------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Approved Death Ninja menu capture      | `death-ninja/menu-{480,768,2220}.{avif,webp}`    | Main menu                                            |
| Approved Death Ninja level capture (1) | `death-ninja/level-1-{480,768,2220}.{avif,webp}` | Platforming level with coin and life counters        |
| Approved Death Ninja level capture (2) | `death-ninja/level-2-{480,768,2220}.{avif,webp}` | Platforming level with vertical shafts and platforms |
| Approved Death Ninja boss capture      | `death-ninja/boss-{480,768,2220}.{avif,webp}`    | Boss encounter                                       |
| Approved Death Ninja options capture   | `death-ninja/options-{480,768,2220}.{avif,webp}` | Volume and character-choice options                  |
| Approved Death Ninja win capture       | `death-ninja/win-{480,768,2220}.{avif,webp}`     | Win screen                                           |

Regenerate these outputs with `npm run assets:images --` and the named source arguments documented by `scripts/optimize-project-images.ts`. The script accepts any subset of its named `--<variant>` flags. Source locations are intentionally not stored in public files.
