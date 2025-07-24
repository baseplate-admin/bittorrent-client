// components/MapContainer.tsx
"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export function MapContainer() {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const mapDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mapDiv.current && !mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapDiv.current,
                style: "https://demotiles.maplibre.org/style.json",
                center: [0, 20],
                zoom: 2,
                dragRotate: false,
                renderWorldCopies: false,
            });

            mapRef.current.on("load", async () => {
                const origin = mockIPToCountry("103.1.2.3");
                const bandwidthData = mockBandwidthData();

                const destCountries = bandwidthData.map((d) => ({
                    ...mockIPToCountry(d.dest_ip),
                    dest_ip: d.dest_ip,
                    bandwidth_in: d.bandwidth_in,
                    bandwidth_out: d.bandwidth_out,
                }));

                drawBandwidthArcs(mapRef.current!, origin, destCountries);
            });
        }
    }, []);

    return <div ref={mapDiv} className="h-screen w-full" />;
}

function mockIPToCountry(ip: string) {
    const map: Record<string, any> = {
        "103.1.2.3": {
            lat: 23.685,
            lon: 90.356,
            countryCode: "BD",
            countryName: "Bangladesh",
        },
        "1.1.1.1": {
            lat: -25.274,
            lon: 133.775,
            countryCode: "AU",
            countryName: "Australia",
        },
        "8.8.8.8": {
            lat: 37.751,
            lon: -97.822,
            countryCode: "US",
            countryName: "USA",
        },
        "45.5.6.7": {
            lat: 48.8566,
            lon: 2.3522,
            countryCode: "FR",
            countryName: "France",
        },
    };
    return (
        map[ip] || { lat: 0, lon: 0, countryCode: "??", countryName: "Unknown" }
    );
}

function mockBandwidthData() {
    return [
        { dest_ip: "1.1.1.1", bandwidth_in: 50000, bandwidth_out: 10000 },
        { dest_ip: "8.8.8.8", bandwidth_in: 15000, bandwidth_out: 30000 },
        { dest_ip: "45.5.6.7", bandwidth_in: 8000, bandwidth_out: 6000 },
    ];
}

function drawBandwidthArcs(
    map: maplibregl.Map,
    origin: { lat: number; lon: number; countryName: string },
    destinations: {
        lat: number;
        lon: number;
        countryCode: string;
        countryName: string;
        dest_ip: string;
        bandwidth_in: number;
        bandwidth_out: number;
    }[],
) {
    const features: any[] = [];

    destinations.forEach((dest) => {
        if (dest.bandwidth_out > 0) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [origin.lon, origin.lat],
                        [dest.lon, dest.lat],
                    ],
                },
                properties: {
                    bandwidth: dest.bandwidth_out,
                    direction: "outgoing",
                    source: origin.countryName,
                    destination: dest.countryName,
                },
            });
        }
        if (dest.bandwidth_in > 0) {
            features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [dest.lon, dest.lat],
                        [origin.lon, origin.lat],
                    ],
                },
                properties: {
                    bandwidth: dest.bandwidth_in,
                    direction: "incoming",
                    source: dest.countryName,
                    destination: origin.countryName,
                },
            });
        }
    });

    const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
    };

    if (map.getSource("bandwidth-arcs")) {
        (map.getSource("bandwidth-arcs") as maplibregl.GeoJSONSource).setData(
            geojson,
        );
    } else {
        map.addSource("bandwidth-arcs", {
            type: "geojson",
            data: geojson,
        });

        map.addLayer({
            id: "bandwidth-arcs",
            type: "line",
            source: "bandwidth-arcs",
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-color": [
                    "match",
                    ["get", "direction"],
                    "outgoing",
                    "#00bfff",
                    "incoming",
                    "#ff4081",
                    "#999",
                ],
                "line-width": [
                    "interpolate",
                    ["linear"],
                    ["get", "bandwidth"],
                    1000,
                    1,
                    10000,
                    2,
                    50000,
                    4,
                    100000,
                    6,
                    500000,
                    8,
                ],
                "line-opacity": 0.75,
            },
        });

        const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
        });

        map.on("mouseenter", "bandwidth-arcs", (e) => {
            map.getCanvas().style.cursor = "pointer";
            const props = e.features?.[0]?.properties;
            if (props) {
                const html = `
          <div>
            <strong>${props.source} → ${props.destination}</strong><br/>
            Direction: ${props.direction}<br/>
            Bandwidth: ${props.bandwidth} B/s
          </div>
        `;
                popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
            }
        });

        map.on("mouseleave", "bandwidth-arcs", () => {
            map.getCanvas().style.cursor = "";
            popup.remove();
        });
    }
}

export default function Page() {
    return <MapContainer />;
}
