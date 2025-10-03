/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @description Detect PO Fully Billed
 * @author Fahri Jummadil Iqram Selayan
 */

define(["N/record", "N/search", "N/log", "N/runtime"], function (
  record,
  search,
  log,
  runtime
) {
  function beforeSubmit(context) {
    try {
      if ((context.type !== context.type) !== context.UserEventType.EDIT) {
        return;
      }
      var poRecord = context.newRecord;
      var oldPoRecord = context.oldRecord;

      // cek apakah status sudah berubah menjadi "Fully Billed"
      var newStatus = poRecord.getValue({ fieldId: "status" });
      var oldStatus = oldPoRecord.getValue({ fieldId: "status" });

      if (newStatus === "Fully Billed" && oldStatus !== "Fully Billed") {
        log.debug({
          title: "PO Fully Billed Detected",
          details: "PO ID: " + poRecord.getValue("tranid"),
        });

        //set custom field untuk menendai PO siap diproses
        poRecord.setValue({
          fieldId: "custbody_ready_for_auto_close",
          value: true,
        });

        //set custom field timestamp
        poRecord.setValue({
          fieldId: "custbody_auto_close_date",
          value: new Date(),
        });
      }
    } catch (e) {
      log.error({
        title: "Error in beforeSubmit",
        details: e.toString(),
      });
    }
  }
  return {
    beforeSubmit: beforeSubmit,
  };
});
