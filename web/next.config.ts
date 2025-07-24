import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // images: { unoptimized: true },
    output: "standalone",
    productionBrowserSourceMaps: true,
    experimental: {
        reactCompiler: true,
        inlineCss: true,
    },
    compiler: {
        styledComponents: true,
    },
    turbopack: {
        rules: {
            "*.svg": {
                as: "*.ts",
                loaders: ["@svgr/webpack"],
            },
        },
    },
    webpack(config) {
        config.experiments = {
            asyncWebAssembly: true,
            layers: true,
            topLevelAwait: true,
        };

        config.module.rules.push({
            test: /\.wasm$/,
            type: "webassembly/async",
        });
        config.module.rules.push({
            test: /\.svg$/i,
            use: ["@svgr/webpack"],
        });
        return config;
    },
};

export default nextConfig;
