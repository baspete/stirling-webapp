// Helpers for fetch to reject on http errors
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function parseJSON(response) {
  return response.json();
}

/*
* This is a convenience wrapper for the fetch API to send
* some default headers and handle HTTP or network errors as
* promise rejections.
* (Default fetch API will only reject a promise
* on a network error).
* As this app only uses JSON APIs, always parse the response
* as a JSON string.
*/
function myFetch(url, options) {
  const myOpts = Object.assign({
    credentials: 'same-origin',
    // This app only uses JSON APIs
    headers: new Headers({
      Accept: 'application/json',
      'X-SUPER-SECRET-READ': 'blah-blah-123-let-me-see'
    }),
  }, options);
  return fetch(url, myOpts)
    .then(checkStatus)
    .then(parseJSON);
}

export default myFetch;
