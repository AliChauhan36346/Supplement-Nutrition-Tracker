interface ScanResult {
  name: string;
  brand: string;
  barcode: string;
}

let pending: ScanResult | null = null;

export function setScanResult(result: ScanResult | null) {
  pending = result;
}

export function consumeScanResult(): ScanResult | null {
  const r = pending;
  pending = null;
  return r;
}
