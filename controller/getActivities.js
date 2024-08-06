const Learnosity = require("learnosity-sdk-nodejs");
const FormData = require("form-data");
const https = require("https");
const promiseRequest = require("./promiseRequest");
const { consumerSecret, consumerKey, domain } = require("../utils/constants");
const SetActivitiesTag = require("./setActivitiesTag");

async function GetActivities(userIds, tag, next = null, collectedData = []) {
  const learnositySdk = new Learnosity();
  const request1 = learnositySdk.init(
    "data",
    {
      consumer_key: consumerKey,
      domain,
    },
    consumerSecret,
    {
      limit: 50,
      ...(next && {
        next,
      }),
      include: {
        activities: ["dt_created", "created_by"],
      },
      created_by: userIds,
    },
    "get" // action type
  );
  var form = new FormData();
  form.append("security", request1.security);
  form.append("request", request1.request);
  form.append("action", request1.action);
  var request2 = https.request({
    host: "data.learnosity.com",
    path: "/v2024.2.LTS/itembank/activities",
    method: "POST",
    headers: form.getHeaders(),
  });
  form.pipe(request2);
  try {
    const response = await promiseRequest(request2);
    const result = JSON.parse(response);
    // Check if there is a next value
    const success = result?.meta?.status;
    const nextValue = result?.meta?.next;
    console.log("Received activities");
    if (nextValue) {
      console.log("Going on next", nextValue);
    }
    if (success && result?.data?.length > 0) {
      console.log(`Now Setting Activities Tags ${tag}`);
      const activitiesArray = result?.data?.map((val) => ({
        reference: val.reference,
        tags: {
          institution: tag,
        },
      }));
      try {
        await SetActivitiesTag(activitiesArray, tag);
      } catch (error) {
        console.log(`failed to set this activities tag ${tag}`, error);
      }
    }

    // Collect the data
    collectedData.push(result);

    // If there is a next value, recursively call GetActivities
    if (success && nextValue) {
      return GetActivities(userIds, tag, nextValue, collectedData);
    }

    // Return the collected data when there are no more next values
    return collectedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    // Handle the error, e.g., retry, log, or return what has been collected so far
    // For example, you might want to retry a few times before giving up
    return collectedData; // or throw error to propagate the error
  }
}

module.exports = GetActivities;
