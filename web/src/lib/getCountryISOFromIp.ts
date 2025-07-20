import { type Maxmind } from "@josh-hemphill/maxminddb-wasm";

export const getCountryISOFromIp = (() => {
    let maxmindInstancePromise: Promise<Maxmind> | null = null;

    async function loadMaxmind(): Promise<Maxmind> {
        if (maxmindInstancePromise) {
            return maxmindInstancePromise;
        }

        maxmindInstancePromise = (async () => {
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
            return new MaxmindConstructor(dbFile);
        })();

        return maxmindInstancePromise;
    }

    return async function (ip: string): Promise<string | null> {
        try {
            const maxmindInstance = await loadMaxmind();
            const result = maxmindInstance.lookup_city(ip);
            return result?.country?.iso_code ?? null;
        } catch (err) {
            console.error("getCountryISOFromIp error:", err);
            return null;
        }
    };
})();
