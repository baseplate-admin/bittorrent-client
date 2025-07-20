import { type Maxmind } from "@josh-hemphill/maxminddb-wasm";

export async function getCountryISOFromIp(ip: string): Promise<string | null> {
    try {
        const wasmModule = await import("@josh-hemphill/maxminddb-wasm");
        const MaxmindConstructor = (wasmModule.Maxmind ||
            wasmModule) as unknown as typeof Maxmind;
        if (!MaxmindConstructor) {
            throw new Error("Failed to load Maxmind constructor");
        }

        const response = await fetch(
            "/GeoLite2-Country_20250716/GeoLite2-Country.mmdb",
        );
        if (!response.ok) {
            throw new Error(`Failed to load mmdb: ${response.status}`);
        }
        const dbFile = new Uint8Array(await response.arrayBuffer());

        const maxmindInstance: Maxmind = new MaxmindConstructor(dbFile);
        const result = maxmindInstance.lookup_city(ip);

        return result?.country?.iso_code ?? null;
    } catch (err) {
        console.error("getCountryISOFromIp error:", err);
        return null;
    }
}
