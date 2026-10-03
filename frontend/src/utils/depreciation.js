/**
 * Calculates straight-line depreciation for an asset.
 * @param {Object} asset - The asset object from the database
 * @returns {Object} - An object containing annualDepreciation, accumulatedDepreciation, and currentBookValue.
 */
export const calculateDepreciation = (asset) => {
    // Only calculate for approved Fixed Assets
    if (asset.major_category !== 'Fixed Asset' || asset.approval_status !== 'Approved') {
        return {
            annualDepreciation: 0,
            accumulatedDepreciation: 0,
            currentBookValue: parseFloat(asset.purchase_cost) || 0,
            isDepreciable: false
        };
    }

    const cost = parseFloat(asset.purchase_cost) || 0;
    const residualValue = parseFloat(asset.residual_value) || 0;
    const usefulLife = parseInt(asset.useful_life, 10);

    // Default useful life to 5 years if not provided or invalid
    const lifeSpanInYears = (isNaN(usefulLife) || usefulLife <= 0) ? 5 : usefulLife;

    const purchaseDate = new Date(asset.purchase_date);
    const currentDate = new Date(); // Current local time as fallback

    if (isNaN(purchaseDate.getTime()) || !asset.purchase_date) {
        return {
            annualDepreciation: 0,
            accumulatedDepreciation: 0,
            currentBookValue: cost,
            isDepreciable: false,
            error: "Invalid Purchase Date"
        };
    }

    // Straight-Line Depreciation Formula: (Cost - Residual Value) / Useful Life
    const depreciableAmount = cost - residualValue;
    const annualDepreciation = depreciableAmount / lifeSpanInYears;
    const monthlyDepreciation = annualDepreciation / 12;

    // Calculate elapsed months securely
    let elapsedMonths = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12;
    elapsedMonths -= purchaseDate.getMonth();
    elapsedMonths += currentDate.getMonth();

    // Prevent negative elapsed time if purchase date is in the future
    if (elapsedMonths < 0) elapsedMonths = 0;

    let accumulatedDepreciation = monthlyDepreciation * elapsedMonths;

    // Cap accumulated depreciation at depreciable amount
    if (accumulatedDepreciation > depreciableAmount) {
        accumulatedDepreciation = depreciableAmount;
    }

    const currentBookValue = cost - accumulatedDepreciation;

    return {
        annualDepreciation,
        accumulatedDepreciation,
        currentBookValue,
        isDepreciable: true
    };
};
