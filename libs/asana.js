var axios = require("axios");
// const asana = require('asana');
const { sendLineNotify } = require('../libs/line');

const asanaToken = process.env.asanaToken;
// const client = asana.Client.create().useAccessToken(asanaToken);

module.exports.myworkspace = async function myworkspace() {
  const workspaces = await getMyWorkSpace();
  if (workspaces.data) {
    return workspaces.data;
  } else {
    return [];
  }
}

module.exports.init = async function init(apiUrl, workspaceId) {
  const webhooks = await getMultipleWebhook(workspaceId);
  if (webhooks.data && webhooks.data.length > 0) {
    await Promise.all(webhooks.data.map(async hook => {
      await deleteWebhook(hook.gid);
    }))
  }
  await settingWebhookNewProject(apiUrl, workspaceId);
  const projects = await getProjectList(workspaceId);
  if (projects.data && projects.data.length > 0) {
    console.log(projects.data[projects.data.length - 1].name);
    const projectsSorted = await projects.data.sort(function (a, b) {
      return a.created_at.localeCompare(b.created_at);
    });
    if (projectsSorted.length > 1) await settingWebhookMoveTask(apiUrl, projectsSorted[projectsSorted.length - 2].gid);
    await settingWebhookMoveTask(apiUrl, projectsSorted[projectsSorted.length - 1].gid);
  }
}

module.exports.isCreateNewProject = async function isCreateNewProject(apiUrl, events) {
  if (events.length) {
    await Promise.all(events.map(async event => {
      if (event.action == 'added' && event.resource.resource_type && event.resource.resource_type == 'project') {
        settingWebhookMoveTask(apiUrl, event.resource.gid);
      }
    }))
  }
}

module.exports.isSectionChange = async function isSectionChange(events) {
  if (events.length) {
    await Promise.all(events.map(async event => {
      if (event.action == 'added' && event.resource.resource_subtype && event.resource.resource_subtype == 'section_changed') {
        // const story = await getStory(event.resource.gid);
        // if (story && story.data) {
        //   console.log(story);
        //   const toSection = story.data.text.substring(
        //     story.data.text.indexOf("to \"") + 4,
        //     story.data.text.lastIndexOf("\"")
        //   )
        //   if (toSection == "QA Done on UAT") {
        //     const taskName = story.data.target.name;
        //     const subject = `Task ${taskName} is moved to ${toSection}`;
        //     console.log(subject);
        //     // alert line
        //   }
        // }
        const task = await getTask(event.parent.gid);
        if (task && task.data && task.data.memberships && task.data.memberships.length > 0) {
          const currentSection = task.data.memberships[0].section.name;
          if (currentSection.includes("QA Done on UAT")) {
            const taskName = task.data.name;
            const subject = `\nTask : ${taskName || ""}\nHas moved to : ${currentSection || ""}`;
            console.log(subject);
            // alert line
            await sendLineNotify(subject);
          }
        }
      }
    }))
  }
}

async function getStory(storyGid) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/stories/' + storyGid,
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function settingWebhookNewProject(apiUrl, workspaceId) {
  let data = JSON.stringify({
    "data": {
      "target": `${apiUrl}/receivewebhook/newproject`,
      "resource": workspaceId,
      "filters": [
        {
          "resource_type": "project",
          "action": "added"
        }
      ]
    }
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/webhooks?opt_pretty=true&opt_fields=followers,assignee',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': asanaToken
    },
    data: data
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function settingWebhookMoveTask(apiUrl, projectGid) {
  let data = JSON.stringify({
    "data": {
      "target": `${apiUrl}/receivewebhook/movetasksection`,
      "resource": projectGid,
      "filters": [
        {
          "action": "added",
          "resource_type": "story",
          "resource_subtype": "section_changed"
        }
      ]
    }
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/webhooks?opt_pretty=true&opt_fields=followers,assignee',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': asanaToken
    },
    data: data
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function getMultipleWebhook(workspaceId) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/webhooks?workspace=' + workspaceId,
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function deleteWebhook(gid) {
  let config = {
    method: 'delete',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/webhooks/' + gid,
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function getProjectList(workspaceId) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/projects?workspace=' + workspaceId + '&opt_fields=name,created_at',
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function getMyWorkSpace() {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/workspaces',
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}

async function getTask(taskGid) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://app.asana.com/api/1.0/tasks/' + taskGid,
    headers: {
      'Accept': 'application/json',
      'Authorization': asanaToken
    }
  };

  return await axios(config)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.log(error.response.data);
      return null;
    });
}