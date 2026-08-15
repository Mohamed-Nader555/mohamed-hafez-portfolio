const ENCRYPTED_TWO_PAGE_PDF =
  'JVBERi0xLjMKJeLjz9MKMSAwIG9iago8PAovUHJvZHVjZXIgPDAxNjEzOGNiMjc+Cj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMgovS2lkcyBbIDQgMCBSIDUgMCBSIF0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9SZXNvdXJjZXMgPDwKPj4KL01lZGlhQm94IFsgMC4wIDAuMCA2MTIgNzkyIF0KL1BhcmVudCAyIDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Cj4+Ci9NZWRpYUJveCBbIDAuMCAwLjAgNjEyIDc5MiBdCi9QYXJlbnQgMiAwIFIKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1YgMgovUiAzCi9MZW5ndGggMTI4Ci9QIDQyOTQ5NjcyOTIKL0ZpbHRlciAvU3RhbmRhcmQKL08gPGE4MTdjMDMyMWNlYjkyYzA0NzA5MjA3NjEwNDYyZGY1YmViMDMyY2MwYWE0OGE2NzBmOWFlZjUzNzU5NjM3ZDY+Ci9VIDxlMjVkMDA2MjUxZDAxZmJkMzY5M2E1MTdjMTdlN2NlYzI4YmY0ZTVlNGU3NThhNDE2NDAwNGU1NmZmZmEwMTA4Pgo+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNTkgMDAwMDAgbiAKMDAwMDAwMDEyNCAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAyNjcgMDAwMDAgbiAKMDAwMDAwMDM2MSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDcKL1Jvb3QgMyAwIFIKL0luZm8gMSAwIFIKL0lEIFsgPDM0NjEzNjM4MzIzNzM2NjQzMTMxMzAzNjY1NjUzMzM2MzczMTM2Mzg2MzYzMzEzOTM4MzI2NjY2MzAzMjY1Mzc+IDwzNDYxMzYzODMyMzczNjY0MzEzMTMwMzY2NTY1MzMzNjM3MzEzNjM4NjM2MzMxMzkzODMyNjY2NjMwMzI2NTM3PiBdCi9FbmNyeXB0IDYgMCBSCj4+CnN0YXJ0eHJlZgo1NzYKJSVFT0YK';

function createObject(objectNumber: number, body: string) {
  return `${objectNumber} 0 obj\n${body}\nendobj\n`;
}

export function createPdf(pageCount: number): Buffer {
  const contentObjectNumber = pageCount + 3;
  const objects = [
    createObject(1, '<< /Type /Catalog /Pages 2 0 R >>'),
    createObject(
      2,
      `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, index) => `${index + 3} 0 R`).join(' ')}] /Count ${pageCount} >>`,
    ),
    ...Array.from({ length: pageCount }, (_, index) =>
      createObject(
        index + 3,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectNumber} 0 R /Resources << >> >>`,
      ),
    ),
    createObject(contentObjectNumber, '<< /Length 0 >>\nstream\n\nendstream'),
  ];
  const header = '%PDF-1.4\n';
  const body = objects.join('');
  const offsets: number[] = [];
  let offset = Buffer.byteLength(header);
  for (const object of objects) {
    offsets.push(offset);
    offset += Buffer.byteLength(object);
  }
  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((entry) => `${String(entry).padStart(10, '0')} 00000 n `),
  ].join('\n');
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(`${header}${body}${xref}\n${trailer}`);
}

export function createTruncatedPdf(): Buffer {
  return Buffer.from(
    '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\ntrailer << /Root 1 0 R >>\nstartxref\n999999\n%%EOF\n',
  );
}

export function createEncryptedPdf(): Buffer {
  return Buffer.from(ENCRYPTED_TWO_PAGE_PDF, 'base64');
}
