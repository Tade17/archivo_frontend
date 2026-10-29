import { vi } from 'vitest';
import { descargarCsv } from './export-csv';

describe('descargarCsv', () => {
  it('genera un CSV UTF-8 con BOM, comillas escapadas y protección contra fórmulas', async () => {
    let blob: Blob | undefined;
    let nombre = '';
    URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), 'blob:csv'));
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      nombre = this.download;
    });

    descargarCsv(
      'datos.csv',
      ['A', 'B'],
      [
        ['dijo "hola"', '=SUMA(A1)'],
        ['José', ''],
      ],
    );

    expect(nombre).toBe('datos.csv');
    expect([...new Uint8Array(await blob!.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect((await blob!.text()).split('\r\n')).toEqual([
      '"A","B"',
      '"dijo ""hola""","\'=SUMA(A1)"',
      '"José",""',
    ]);
  });
});
