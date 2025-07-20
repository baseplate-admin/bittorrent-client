// components/CountryFlag.tsx
import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import type { FC, HTMLAttributes } from "react";

type FlagComponent = FC<HTMLAttributes<HTMLElement>>;

export function CountryFlag({
    iso,
    ...props
}: { iso: string } & React.HTMLAttributes<HTMLElement>) {
    const Code = iso.toUpperCase();
    const flagMap: Record<string, FlagComponent> = Flags;

    const Flag: FlagComponent | undefined = flagMap[Code];

    if (!Flag) {
        return <span title="Unknown flag">🏳️</span>;
    }

    return <Flag {...props} />;
}
