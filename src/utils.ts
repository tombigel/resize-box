const S4 = (): string => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const randomUUIDDumbPolyfill = (): string => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
export const randomId = (): string => crypto.randomUUID?.() || randomUUIDDumbPolyfill();

/**
 * Limit a number between 2 values, inclusive, order doesn't matter
 * @param {number} n1
 * @param {number} n2
 * @param {number} n3
 * @returns {number}
 */
export const clamp = (n1: number, n2: number = n1, n3: number = n2): number => {
    const [min, num, max] = [n1, n2, n3].sort((a, b) => a - b);
    return Math.min(max, Math.max(min, num));
};
