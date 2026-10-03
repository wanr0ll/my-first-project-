/**
 * Utility for GHA Asset Finance matching official Public Sector standards.
 */

/**
 * Calculates straight-line depreciation for an asset.
 * @param {number} cost - Initial acquisition cost.
 * @param {number} residualValue - Estimated value at end of life (usually 0 or 5-10% for GHA).
 * @param {number} usefulLife - Useful life in years.
 * @param {string} dateAcquired - ISO date string of acquisition.
 * @returns {object} - { currentBookValue, accumulatedDepreciation, ageYears }
 */
export const calculateDepreciation = (cost, residualValue = 0, usefulLife, dateAcquired) => {
    if (!cost || !usefulLife || !dateAcquired) return { currentBookValue: cost, accumulatedDepreciation: 0, ageYears: 0 };

    const purchaseDate = new Date(dateAcquired);
    const now = new Date();
    const ageInMs = now - purchaseDate;
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

    // Annual Depreciation Amount
    const annualDepreciation = (cost - residualValue) / usefulLife;

    // Total Accumulated Depreciation (capped at total depreciable amount)
    let accumulatedDepreciation = annualDepreciation * ageInYears;
    if (accumulatedDepreciation > (cost - residualValue)) {
        accumulatedDepreciation = cost - residualValue;
    }

    const currentBookValue = Math.max(residualValue, cost - accumulatedDepreciation);

    return {
        currentBookValue: parseFloat(currentBookValue.toFixed(2)),
        accumulatedDepreciation: parseFloat(accumulatedDepreciation.toFixed(2)),
        ageYears: parseFloat(ageInYears.toFixed(2))
    };
};

/**
 * Standardizes Asset ID based on GHA SRS.
 * Format: GHA-[CAT]-[YEAR]-[SEQ]
 */
export const generateAIN = (category, sequence) => {
    const year = new Date().getFullYear();
    const catCode = category.toUpperCase().slice(0, 3);
    const seqStr = sequence.toString().padStart(4, '0');
    return `GHA-${catCode}-${year}-${seqStr}`;
};
