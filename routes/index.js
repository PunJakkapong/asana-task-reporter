var express = require('express');
var router = express.Router();
const crypto = require("crypto");
// const asana = require('asana');

const { init, myworkspace, isCreateNewProject, isSectionChange } = require('../libs/asana');

let secret = "";
const base_url = process.env.base_url;

router.get('/', async (req, res) => {
  const workspaces = await myworkspace();
  return res.status(200).json({ workspaces });
});

router.post('/init', async (req, res) => {
  await init(req.body.api_url, req.body.workspace_id)
  res.sendStatus(200);
});

router.get('/callback', function (req, res, next) {
  if (req.headers["x-hook-secret"]) {
    console.log("This is a new webhook");
    secret = req.headers["x-hook-secret"];

    res.setHeader("X-Hook-Secret", secret);
    res.sendStatus(200);
  }
  res.sendStatus(200);
});

router.post("/receivewebhook/newproject", async (req, res) => {
  if (req.headers["x-hook-secret"]) {
    console.log("This is a new webhook");
    secret = req.headers["x-hook-secret"];
    console.log(secret);

    res.setHeader("X-Hook-Secret", secret);
    res.sendStatus(200);
  } else if (req.headers["x-hook-signature"]) {
    const computedSignature = crypto
      .createHmac("SHA256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(req.headers["x-hook-signature"]),
        Buffer.from(computedSignature)
      )
    ) {
      // Fail
      res.sendStatus(401);
    } else {
      // Success
      console.log(`Events on ${Date()}:`);
      console.log(req.body.events);
      await isCreateNewProject(base_url, req.body.events);
      res.sendStatus(200);
    }
  } else {
    console.error("Something went wrong!");
    res.sendStatus(401);
  }
});

router.post("/receiveWebhook/movetasksection", async (req, res) => {
  if (req.headers["x-hook-secret"]) {
    console.log("This is a new webhook");
    secret = req.headers["x-hook-secret"];
    console.log(secret);

    res.setHeader("X-Hook-Secret", secret);
    res.sendStatus(200);
  } else if (req.headers["x-hook-signature"]) {
    const computedSignature = crypto
      .createHmac("SHA256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(req.headers["x-hook-signature"]),
        Buffer.from(computedSignature)
      )
    ) {
      // Fail
      res.sendStatus(401);
    } else {
      // Success
      console.log(`Events on ${Date()}:`);
      console.log(req.body.events);
      await isSectionChange(req.body.events);
      res.sendStatus(200);
    }
  } else {
    console.error("Something went wrong!");
    res.sendStatus(401);
  }
});

module.exports = router;
