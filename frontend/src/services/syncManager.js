import { toast } from 'react-hot-toast';

const QUEUE_KEY = 'makalmy_offline_queue';

export const getQueue = () => {
    try {
        const queue = localStorage.getItem(QUEUE_KEY);
        return queue ? JSON.parse(queue) : [];
    } catch {
        return [];
    }
};

export const addToQueue = (requestConfig) => {
    const queueItem = {
        id: Date.now() + Math.random(),
        url: requestConfig.url,
        method: requestConfig.method,
        data: requestConfig.data,
        timestamp: Date.now()
    };
    const queue = getQueue();
    queue.push(queueItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    toast('Saisie sauvegardée hors ligne. Elle sera synchronisée au retour d\'internet.', { icon: '📶', duration: 3000 });
};

export const clearQueue = () => {
    localStorage.removeItem(QUEUE_KEY);
};

export const processQueue = async (apiClient) => {
    const queue = getQueue();
    if (queue.length === 0) return;

    toast('Réseau retrouvé : Synchronisation des données...', { icon: '🔄', duration: 4000 });

    let successCount = 0;
    const newQueue = [];

    for (const item of queue) {
        try {
            await apiClient({
                url: item.url,
                method: item.method,
                data: item.data
            });
            successCount++;
        } catch (error) {
            console.error("Erreur sync offline", error);
            // If it's a 4xx error (validation, auth), do not retry to avoid infinite loops
            if (!error.response || error.response.status >= 500) {
                newQueue.push(item);
            }
        }
    }

    if (newQueue.length > 0) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
        if (successCount > 0) {
            toast.success(`${successCount} action(s) synchronisée(s). D'autres sont en attente.`);
        }
    } else {
        clearQueue();
        toast.success(`Parfait ! Les ${successCount} actions hors-ligne ont été synchronisées sur le serveur !`);
    }
};
