const fileService = require("../services/fileService");


module.exports = {
  service: () => {
    return fileService.client();
  },

  upload: function(client, path, payload) {
    return fileService.saveJsonAsFile(client, path, payload);
  },

  download: function(client, path) {
    return fileService.getFileAsJson(client, path);
  },

  constructPath: function(instanceId) {
    const datetimeString = new Date().toISOString().replace(/[:\.]/g, '_');
    return `${instanceId}/${instanceId}_${datetimeString}.json`;
  },

  queryRecords: function(client, instanceId) {
    return fileService.listFilesWithPrefix(client, instanceId);
  }

}
