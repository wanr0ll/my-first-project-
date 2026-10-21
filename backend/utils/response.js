/**
 * Standardized API Response Utilities
 */

function success(res, data = null, message = 'Success', code = 200) {
    return res.status(code).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
}

function error(res, message = 'Error', code = 400, errors = null) {
    return res.status(code).json({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    });
}

function paginated(res, data, total, page, perPage, message = 'Success', code = 200) {
    const totalCount = parseInt(total, 10) || 0;
    const currentPage = parseInt(page, 10) || 1;
    const limit = parseInt(perPage, 10) || 10;
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.status(code).json({
        success: true,
        message,
        data,
        pagination: {
            total: totalCount,
            page: currentPage,
            per_page: limit,
            total_pages: totalPages
        },
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    success,
    error,
    paginated
};
