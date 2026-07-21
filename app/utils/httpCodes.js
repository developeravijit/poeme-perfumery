const httpCodes = {
  continue: 100,
  processing: 102,
  ok: 200,
  created: 201,
  accepted: 202,
  no_content: 204,
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  server_error: 500,
  service_unavailable: 503,
  gateway_timeout: 504,
};

module.exports = httpCodes;
