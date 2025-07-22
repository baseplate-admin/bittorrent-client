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

/**
 * Deep merge `updates` into `target`, recursively replacing values.
 * @param target - full object to update
 * @param updates - partial object with new values to apply
 * @returns new object with updated values
 */
export function deepMerge<T>(target: T, updates: Partial<T>): DeepMerge<T> {
    // shallow clone target so we don't mutate original
    const output = { ...target } as any;

    if (isObject(target) && isObject(updates)) {
        for (const key of Object.keys(updates) as (keyof T)[]) {
            const updateValue = updates[key];
            const targetValue = target[key];

            if (Array.isArray(updateValue)) {
                // Replace arrays outright; customize here to merge arrays differently if needed
                output[key] = updateValue;
            } else if (isObject(updateValue) && isObject(targetValue)) {
                // Recursively merge nested objects
                output[key] = deepMerge(targetValue, updateValue);
            } else {
                // Primitive or undefined: replace with updateValue
                output[key] = updateValue;
            }
        }
    }

    return output;
}
