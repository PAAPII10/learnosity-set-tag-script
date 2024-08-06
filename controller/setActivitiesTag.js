const Learnosity = require("learnosity-sdk-nodejs");
const FormData = require("form-data");
const https = require("https");
const promiseRequest = require("./promiseRequest");
const { consumerSecret, consumerKey, domain } = require("../utils/constants");

async function SetActivitiesTag(activities, tag) {
  const learnositySdk = new Learnosity();
  const request1 = learnositySdk.init(
    "data",
    {
      consumer_key: consumerKey,
      domain,
    },
    consumerSecret,
    {
      activities,
    },
    "set" // action type
  );
  console.log({ request1 });
  var form = new FormData();
  form.append("security", request1.security);
  form.append("request", request1.request);
  form.append("action", request1.action);
  var request2 = https.request({
    host: "data.learnosity.com",
    path: "/v2024.2.LTS/itembank/activities/tags",
    method: "POST",
    headers: form.getHeaders(),
  });
  form.pipe(request2);
  const result = await promiseRequest(request2);
  const output = JSON.parse(result);
  console.error(
    `This tag set successfully for activities: ${tag} success ${output?.meta?.status}`
  );
  return result;
}

module.exports = SetActivitiesTag;
