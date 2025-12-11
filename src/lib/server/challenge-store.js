// Simple in-memory challenge store
// In production, use Redis or similar
const challenges = new Map();

export function storeChallenge(userId, challenge) {
    challenges.set(userId, challenge);

    // Auto-cleanup after 5 minutes
    setTimeout(() => {
        challenges.delete(userId);
    }, 5 * 60 * 1000);
}

export function getChallenge(userId) {
    return challenges.get(userId);
}

export function deleteChallenge(userId) {
    challenges.delete(userId);
}
