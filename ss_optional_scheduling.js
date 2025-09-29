/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @author Fahri Jummadil Iqram Selayan
 */

define(["N/task"], function (task) {
  function execute(context) {
    try {
      //schedule Map/Reduce Script to run daily
      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE,
        scriptId: "mr_proses batch _closing_po", // Replace with your Map/Reduce script ID
      });

      var taskId = mrTask.submit();

      return {
        success: true,
        taskId: taskId,
      };
    } catch (e) {
      log.error({
        title: "Error scheduling Auto Close PO",
        details: e.toString(),
      });
      return {
        success: false,
        error: e.toString(),
      };
    }
  }
  return {
    execute: execute,
  };
});
