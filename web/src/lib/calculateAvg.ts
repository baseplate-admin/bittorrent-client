export function calculateAvg(oldNumber: number, newNumber: number) {
    if (oldNumber === 0) {
        return newNumber;
    }

    return (oldNumber + newNumber) / 2;
}
