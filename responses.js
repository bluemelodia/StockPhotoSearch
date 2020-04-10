const statusCodes = {
    SUCCESS: 0,
    ERROR: -1
};

const errorMessages = {
    INVALID_REQUEST: 'There was a problem with your request.',
    PROCESS_FAILED: 'There was an error processing your request.' 
}

function buildSuccessResponse(data = {}) {
    return JSON.stringify({
        statusCode: statusCodes.SUCCESS,
        responseData: data
    });
}

function buildErrorResponse(msg = errorMessages.PROCESS_FAILED) {
    return JSON.stringify({
        statusCode: statusCodes.ERROR,
        errorMsg: msg
    });
}

module.exports = {
    errMsg: errorMessages,
    reqSuccess: buildSuccessResponse,
    reqError: buildErrorResponse
};