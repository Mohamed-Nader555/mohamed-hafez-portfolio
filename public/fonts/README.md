# Self-hosted portfolio fonts

The portfolio serves these Latin variable-font subsets from the same origin as the site. No font is requested from a third-party origin at runtime.

## Familjen Grotesk

- Role: restrained geometric display and identity face.
- File: `familjen-grotesk-latin-wght-normal.woff2` (variable weight 400–700, normal style).
- Upstream project: <https://github.com/Familjen-Sthlm/Familjen-Grotesk>
- Web subset distribution: `@fontsource-variable/familjen-grotesk` 5.3.0, generated from Google Fonts metadata.
- Copyright: Copyright 2021 The Familjen Grotesk Project Authors.
- License: SIL Open Font License 1.1; see `OFL-Familjen-Grotesk.txt`.
- SHA-256: `414D5DFE5F3D02A327F99AD9121BD77AE931B5B754565578FB0CE4FEDE2DE268`

## Source Sans 3

- Role: neutral, highly legible body and interface face.
- File: `source-sans-3-latin-wght-normal.woff2` (variable weight 200–900, normal style).
- Upstream project: <https://github.com/adobe-fonts/source-sans>
- Web subset distribution: `@fontsource-variable/source-sans-3` 5.3.0, generated from Google Fonts metadata.
- Copyright: Copyright 2010–2020 Adobe, with Reserved Font Name “Source.” Source is a trademark of Adobe in the United States and/or other countries.
- License: SIL Open Font License 1.1; see `OFL-Source-Sans-3.txt`.
- SHA-256: `7A19A7027E125257D310C6DBD78AE3A30B5EA1E3794D60B12BB28227A003BFDA`

Only the Latin WOFF2 subsets required by the launch’s English content are committed. Layout-safe system fallbacks remain in `src/styles/tokens.css`.
