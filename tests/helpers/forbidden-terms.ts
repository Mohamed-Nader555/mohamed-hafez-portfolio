import { createHash } from 'node:crypto';

/**
 * Some names must never appear on the site or anywhere in this public
 * repository, so they cannot be written down here either. Text is tokenized
 * into lowercase one-, two- and three-word sequences; each sequence is hashed
 * (SHA-256) and compared with this constant set.
 *
 * The set holds the banking clients' names (and their common short forms), the
 * template name from the content source's do-not-publish list, and private
 * profile details (people not named on the site, private projects, a home
 * address, date of birth and an old phone number). To add a
 * term, hash its lowercase, space-joined words with `sha256` and add the hex
 * digest; never commit the term itself.
 */
export const FORBIDDEN_HASHES: ReadonlySet<string> = new Set([
  'bb99ac76b8247c11d55c10e48ef8d535445c60f268f1691fa5ff79bc3490a816',
  '3aaedab977c913fe60055549f45122de44107066b3a7146249d1d28f2c86ab2d',
  'fa7f79b426fc69c0b596e20f15b6bd84ba043386f9327bc553f7e467e965a26a',
  'b5a30acf5e5a1f0f1a01fbcaf7615b06afa278ccec7415935c02641d2b9be6ff',
  'e896e5b37ac61ee39aae572d0e49f42aff93c8c6c292712d2ae90637fc555365',
  '4db8e3a035a19d0d2be45fda86a14a12b5a8f95642b894c226de16707f7eaeb5',
  '3a5faa76b89f5dbcd81eec0fdaee9a5c17ba806b2a3d4c9f7b562c3c299db136',
  'ef327d5b8b70cd8a0e78fbf8959acf1d3468ba82b9d0e7424b185d63459ea496',
  'edf52be1ce58dc2e707f66537a6b9c7fae0e9f4f06f902427ec15a3e2aee79e8',
  // People who are not named on the site (full names only).
  '3e2e7a0fe2a333de3452af512420155a9a5fc012b02739e35e63ea7b9bed0d24',
  '2290e4398cf5a03a065b2a7d36b8f1cdc3e485520e729fdcac0f8a511b6a970c',
  '000e47f7affb0505cb6df3bf9c1eda0aabc5366179b937a1ece51240114a41e0',
  '7d627d3c5d81578887e50703a41610e2cf8c7d6734b41d2e7f231d29d23b6f71',
  '2867fb3446054b91f5dcb28de7f28a18668f82a330111245d82aa6e3277105da',
  '0ef3c1e9844ea9ceeb28f7a62c71ee7367974c689c58c52aa64b3d07bb17d736',
  'fd7a1b5e06d3403df24d3013b4567c3e37465cf9236cb15c1570581254e407dc',
  'f99280b12e78e3088b63628a51eeb684c6792399ebfbc44ae21f831fdca81209',
  // Private projects kept as spoken stories.
  '95617e9a311292a5ce62734d996936f6f99e23e432d8b5491b7b01414f6751bb',
  'ade5ec06ef770829926598a8eb825ac45a080fa34b3dd842e6512a31ea139e94',
  '10fe7a1352135e84dd6ac541d1c377ca04a9fa155c0a3c843e2d572465a3976e',
  // Home address and postal codes.
  '05f47d7934268f9aa88c1be4607bf80731442fc4d5fd61a7bccffd6c67222850',
  'f5dc7a6ae9fcb18f8e24d3fb58010ec2c62398336d31f3ae6a140cb9339c8dd8',
  'f3805ba217bf5f6766dd2859d3035756cac345f712ace5eb6bb04d3b850399ee',
  '907b545532a26d81da6f36146adbcac6de4ce1596c57dbed69ddc1b6a9d4aa86',
  'b1825a7178649020d27f05fe6a9ad6f30de1e254e73b61078ec9d3fef94179bc',
  '73cd839ad5efad38fe1f3d86e813fffca1a61f755cd866b86aea18d69f4b4b49',
  // Date of birth in its written forms.
  'bf11764fa1fa5745453c8f197ac89fe0edc6cf5aecef9a4568c34be05a44b71f',
  '3d5df4cbb70c8c29291a2e9cc9c62bf75c822706713d01665d6641e6ba16a385',
  '2946d5e29d39716ca3980e8a521c7edba0eba45df4ea811c8eb578ac2fa65439',
  'e2e89d8daef8c92a9e244fa07a9b877a4cfae014fa2de44436773082d4f3680d',
  'ced2fb302951642db0a8475f4da541feef1b5f6175d8bad04eb87efade1bdfa2',
  'add6e13c09afc18fbfea3ddf537898817d391fdf0962a2665eeceeeab2031041',
  'ca56435d2a362516a2ef929eb9d871f29220feec3f658acce3dfb9641fd5731a',
  '594a80a9b5d59e16f691590abcd31865eda520e14bb54e28c76bd259551d045d',
  '8a39f5f9d4deac7959c509cd8d3af3c37ae18fca3d1323b3eeea52f8e6443e40',
  '2b98a685cf0e0f25ec9055d1769ad11245e7d71a5d97c9431cb34b9f8800e53e',
  // A historical phone number.
  '6861ad64097096d2c5f7a2da6e40e3cde49601b911a2df02c93ee02668435515',
  '5794b24e10c86bba0ed5943a4e43ddf333088cb3bb1afc6f3dedc2b4edaa90c6',
  '6ac69a7c5e51332076c6daa142369d9abc9ee222638a17daab27c1b2feb01bea',
  '67f03499549b3d737cd5579e50ce3de92908663deaa337f2dc794b8f59ee36d9',
]);

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** Lowercase words with accents folded away. */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/**
 * The forbidden sequences found in `text`, reported by hash only (a failure
 * message must not print the term it caught).
 */
export function forbiddenHashesIn(
  text: string,
  forbidden: ReadonlySet<string> = FORBIDDEN_HASHES,
): string[] {
  const tokens = words(text);
  const found = new Set<string>();
  for (let size = 1; size <= 3; size += 1)
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const digest = sha256(tokens.slice(start, start + size).join(' '));
      if (forbidden.has(digest)) found.add(digest);
    }
  return [...found].map((digest) => digest.slice(0, 12));
}
