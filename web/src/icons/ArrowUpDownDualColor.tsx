import styled from "styled-components";
import { ArrowUpDown, type LucideProps } from "lucide-react";

export const ArrowUpDownDualColor = styled(ArrowUpDown)<LucideProps>`
    path:nth-last-of-type(1),
    path:nth-last-of-type(2) {
        stroke: var(--first-color, "white") !important;
    }
    path:nth-last-of-type(3),
    path:nth-last-of-type(4) {
        stroke: var(--second-color, "white") !important;
    }
`;
