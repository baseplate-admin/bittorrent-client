type Primitive = string | number | boolean | null | undefined;
type DeepMerge<T> = {
    [K in keyof T]: T[K] extends Primitive
        ? T[K]
        : T[K] extends Array<infer U>
          ? Array<U>
          : T[K] extends object
            ? DeepMerge<T[K]>
            : T[K];
};

function isObject(item: unknown): item is object {
    return !!item && typeof item === "object" && !Array.isArray(item);
}

export function deepMerge<T>(target: T, source: Partial<T>): DeepMerge<T> {
    const output = { ...target } as any;

    if (isObject(target) && isObject(source)) {
        for (const key of Object.keys(source) as (keyof T)[]) {
            const sourceValue = source[key];
            const targetValue = target[key];

            if (Array.isArray(sourceValue)) {
                // Replace arrays (customize if you want array merging)
                output[key] = sourceValue;
            } else if (isObject(sourceValue) && isObject(targetValue)) {
                output[key] = deepMerge(targetValue, sourceValue);
            } else {
                output[key] = sourceValue;
            }
        }
    }

    return output;
}
