export interface PdfPageOptions {
    pageSize?: PDFFormat;
    pageOrientation?: PDFOrientation;
}

export function parsePdfPageOptions(matter: { [key: string]: any }): PdfPageOptions {
    let result: PdfPageOptions = {};
    Object.keys(matter).forEach(key => {
        switch (key) {
            case 'pageSize':
                result.pageSize = matter[key];
                break;
            case 'pageOrientation':
                result.pageOrientation = matter[key];
                break;
            default:
                break;
        }
    });
    return result;
}

type PDFFormat =
  | "Letter"
  | "Legal"
  | "Tabloid"
  | "Ledger"
  | "A0"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6";

type PDFOrientation =
  | "Portrait"
  | "Landscape";