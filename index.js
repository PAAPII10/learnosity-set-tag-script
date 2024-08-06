require("dotenv").config();
const express = require("express");
const GetActivities = require("./controller/getActivities");
const GetItems = require("./controller/getItems");
const app = express();
app.use(express.json({ limit: "50mb" }));

async function processActivities(users, tag, activitiesArray) {
  if (users.length === 0) {
    return activitiesArray;
  }

  const userChunk = users.slice(0, 350);
  const remainingUsers = users.slice(350);

  try {
    const activitiesResult = await GetActivities(userChunk, tag);
    const output = {
      type: "ACTIVITIES",
      userIdLength: userChunk.length,
      tags: tag,
      success: activitiesResult[0]?.meta?.status,
      next: activitiesResult[0]?.meta?.next || undefined,
      activities: activitiesResult[0]?.data?.length,
      firstUserId: userChunk[0],
      lastUserId: userChunk[userChunk.length - 1],
    };

    activitiesArray.push(output);
  } catch (error) {
    console.error(`Error processing chunk: ${userChunk}`, error);
  }

  return processActivities(remainingUsers, tag, activitiesArray);
}

async function processItems(users, tag, itemsArray) {
  if (users.length === 0) {
    return itemsArray;
  }

  const userChunk = users.slice(0, 350);
  const remainingUsers = users.slice(350);

  try {
    const itemsResult = await GetItems(userChunk, tag);
    const output = {
      type: "ITEMS",
      userIdLength: userChunk.length,
      tags: tag,
      success: itemsResult[0]?.meta?.status,
      next: itemsResult[0]?.meta?.next || undefined,
      activities: itemsResult[0]?.data?.length,
      firstUserId: userChunk[0],
      lastUserId: userChunk[userChunk.length - 1],
    };

    itemsArray.push(output);
  } catch (error) {
    console.error(`Error processing chunk: ${userChunk}`, error);
  }

  return processActivities(remainingUsers, tag, itemsArray);
}
// Script to set tags in activities and items
app.post("/script", async function fetchItems(req, res) {
  try {
    const data = req?.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid input" });
    }
    let activitiesArray = [];
    let itemsArray = [];
    let output = [];
    for await (const item of data) {
      const tag = item?.tag;
      const users = item?.users;

      try {
        // Example async operation
        if (
          Array.isArray(users) &&
          users.length > 0 &&
          Array.isArray(tag) &&
          tag?.length > 0
        ) {
          await processActivities(users, tag, activitiesArray);
          await processItems(users, tag, itemsArray);
          const output1 = {
            sentUsers: users.length,
            activitiesArray,
            itemsArray,
          };
          output.push(output1);
        }
      } catch (error) {
        console.error(`Error processing tag: ${tag}`, error);
      }
    }

    // const result = await GetActivities(userIds);
    // return res.status(200).json({ data: JSON.parse(result) });
    return res.status(200).json({ output });
  } catch (error) {
    // console.error("Error fetching activities:", error);
    console.error("Error fetching activities:", error?.response?.data);
    return res.status(400).json({ data: "Invalid" });
  }
});

app.listen(3002, () => {
  console.log("Server is running on port 3002");
});
