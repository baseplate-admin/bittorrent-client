import { type Maxmind } from "@josh-hemphill/maxminddb-wasm";

let cachedDbFile: Uint8Array | null = null;
// Store a weak reference to the Maxmind constructor/module
let cachedMaxmindRef: WeakRef<Maxmind> | null = null;

export async function getCountryISOFromIp(ip: string) {
    let maxmindConstructor = cachedMaxmindRef?.deref() ?? null;

    if (!maxmindConstructor) {
        const wasmModule = await import("@josh-hemphill/maxminddb-wasm");
        maxmindConstructor = (wasmModule.Maxmind ||
            wasmModule) as unknown as Maxmind;

        if (!maxmindConstructor) {
            throw new Error("Failed to load Maxmind from wasm module");
        }

        // Store weak reference
        cachedMaxmindRef = new WeakRef(maxmindConstructor);
    }

    if (!cachedDbFile) {
        const response = await fetch(
            "/GeoLite2-Country_20250716/GeoLite2-Country.mmdb",
        );
        cachedDbFile = new Uint8Array(await response.arrayBuffer());
    }

    // @ts-expect-error: Maxmind constructor exists
    const maxmindInstance: Maxmind = new maxmindConstructor(cachedDbFile);

    const result = maxmindInstance.lookup_city(ip);

    return result?.country?.iso_code ?? null;
}
