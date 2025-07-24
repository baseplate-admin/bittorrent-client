import React from "react";

type Props = {
    text: string;
};

const HybridSelectedComponent = React.forwardRef<
    HTMLDivElement,
    Readonly<Props>
>(({ text }, ref) => {
    return (
        <div
            ref={ref}
            className="mb-1 flex justify-center rounded-md border p-62"
        >
            {text}
        </div>
    );
});

export default HybridSelectedComponent;
