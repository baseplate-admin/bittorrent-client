import { SetStateAction } from 'jotai';

export const peekQueue = <T>(queue: T[]): T | null => {
    if (queue.length === 0) return null;
    return queue[0] ?? null;
};

export const dequeue = <T>(
    queue: T[],
    setQueue: (update: SetStateAction<T[]>) => void
) => {
    const newQueue = [...queue];
    newQueue.shift();
    setQueue(newQueue);
};
