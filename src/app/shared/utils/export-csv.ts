import { saveBlob } from './save-blob';

// Marca de orden de bytes UTF-8: sin ella Excel mostraría mal las tildes.
const BOM = String.fromCharCode(0xfeff);

/**
 * Descarga una tabla como CSV que Excel abre con tildes correctas (UTF-8 con BOM).
 * Una celda que empieza con = + - @ se antepone con ' para que Excel no la ejecute como fórmula.
 */
export function descargarCsv(
  nombreArchivo: string,
  encabezados: string[],
  filas: string[][],
): void {
  const celda = (v: string) => '"' + (/^[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""') + '"';
  const linea = (valores: string[]) => valores.map(celda).join(',');
  const csv = [linea(encabezados), ...filas.map(linea)].join('\r\n');
  saveBlob(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }), nombreArchivo);
}
