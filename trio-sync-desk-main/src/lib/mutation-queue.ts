export interface OfflineMutation {
    id: string;
    mutationKey: unknown[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variables: any;
    timestamp: number;
    offlineKey: string;
}

const QUEUE_KEY = "offline-mutation-queue";

export const getQueue = (): OfflineMutation[] => {
    try {
        const queue = localStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch (error) {
        console.error("Error reading mutation queue", error);
        return [];
    }
};

export const addToQueue = (mutation: Omit<OfflineMutation, "id" | "timestamp">) => {
    const queue = getQueue();
    const newMutation: OfflineMutation = {
        ...mutation,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
    };
    queue.push(newMutation);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return newMutation;
};

export const removeFromQueue = (id: string) => {
    const queue = getQueue();
    const newQueue = queue.filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
};

export const clearQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
};
