export function fileToBuffer(file: File): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const arrayBuffer = reader.result;
            if (!(arrayBuffer instanceof ArrayBuffer)) {
                reject(new Error("Unexpected result type"));
                return;
            }
            const buffer = Buffer.from(arrayBuffer);
            resolve(buffer);
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsArrayBuffer(file);
    });
}
