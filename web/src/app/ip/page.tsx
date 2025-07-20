"use client";

import { CountryFlag } from "@/components/country-flag";
import { getCountryISOFromIp } from "@/lib/getCountryISOFromIp";
import { useEffect, useState } from "react";

export default function IpPage() {
    const [country, setCountry] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const iso = await getCountryISOFromIp("118.179.63.17");
                if (!iso || typeof iso !== "string")
                    throw new Error("Invalid ISO code");
                setCountry(iso);
            } catch (err: any) {
                setError(err.message || "Failed to get country");
            }
        })();
    }, []);

    if (error) return <div className="text-red-600">Error: {error}</div>;
    if (country === null) return <div>Loading...</div>;

    return (
        <div className="flex items-center space-x-2 text-lg">
            <span>Country for 118.179.63.17:</span>
            <CountryFlag iso={country} />
            <span className="uppercase">BD</span>
        </div>
    );
}
