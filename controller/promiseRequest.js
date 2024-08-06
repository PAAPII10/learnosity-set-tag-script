const Promise = require("promise");

async function promiseRequest(request) {
  return await new Promise((resolve, reject) => {
    let responseData = "";

    request.on("response", function (res) {
      res.on("data", function (chunk) {
        responseData += chunk;
      });

      res.on("end", function () {
        resolve(responseData);
      });

      res.on("error", function (error) {
        reject(error);
      });
    });
  });
}

module.exports = promiseRequest;
