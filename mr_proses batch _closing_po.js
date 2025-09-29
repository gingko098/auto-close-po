/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description Proses Batch Closing PO
 * @author Fahri Jummadil Iqram Selayan
 */

define(["N/record", "N/search", "N/log", "N/email", "N/runtime"], function (
  record,
  search,
  log,
  email,
  runtime
) {
  function getInputData(context) {
    try {
      //search PO yang ready untuk auto closing (status fully billed + custom field ue_detect_po_fully_billed true)
      var poSearch = search.create({
        type: search.Type.PURCHASE_ORDER,
        filters: [
          ["custbody_ready_for_auto_close", "is", "T"],
          "AND",
          ["status", "anyof", "PurchOrd:F"],
          "AND",
          ["mainline", "is", "F"],
          "AND",
          ["closed", "is", "F"],
        ],
        columns: [
          "internalid",
          "tranid",
          "entity",
          "total",
          "currency",
          "custbody_auto_close_date",
          "subdiary",
        ],
      });
      return poSearch;
    } catch (e) {
      log.error({
        title: "Error in getInputData",
        details: e.toString(),
      });
      throw e;
    }
  }

  function map(context) {
    try {
      var poData = JSON.parse(context.value);
      var poId = poData.id;
      var poTrandId = poData.values.tranid;

      log.debug({
        title: "Processong PO",
        details: "PO ID:" + poId + ", TrandId: " + poTrandId,
      });

      //proses PO closure and accrual adjustment
      var result = processPOClosure(poId, poData.values);

      if (result.success) {
        context.write({
          key: poId,
          value: {
            success: "SUCCESS",
            message: result.message,
            poId: poId,
            poTrandId: poTrandId,
            jeId: result.jeId,
          },
        });
      } else {
        context.write({
          key: poId,
          value: {
            success: "FAILED",
            message: result.message,
            poId: poId,
            poTrandId: poTrandId,
            error: result.error,
          },
        });
      }
    } catch (e) {
      log.error({
        title: "Error in map PO:" + poId,
        details: e.toString(),
      });

      context.write({
        key: poId,
        value: {
          success: "ERROR",
          message: e.toString(),
          poId: poId,
        },
      });
    }
  }

  function processPOClosure(poId, poValues) {
    try {
      //1. load PO record
      var poRecord = record.load({
        type: record.Type.PURCHASE_ORDER,
        id: poId,
      });

      //2. Calculate Accrual Adjustment Amount (amont received but not billed)
      var accrualAmount = calculateAccrualAmount(poId);

      //3. Cerate Journal Entry for Accrual Adjustment if needed
      var jeId = null;
      if (accrualAmount > 0) {
        var jeResult = createAccrualAdjustmentJE(poValues, accrualAmount, poId);
      }

      //4. Close PO
      poRecord.setValue({
        fieldId: "closed",
        value: true,
      });
      poRecord.setValue({
        fieldId: "custbody_auto_close_processed",
        value: true,
      });
      poRecord.setValue({
        fieldId: "custbody_auto_close_date",
        value: new Date(),
      });

      var savedPoId = poRecord.save();

      return {
        success: true,
        message: "PO Closed Successfully with accrual adjustment",
        jeId: jeId,
        poId: savedPoId,
        accrualAmount: accrualAmount,
      };
    } catch (e) {
      return {
        success: false,
        message: "Error processing PO closure",
        error: e.toString(),
      };
    }
  }

  function calculateAccrualAmount(poId) {
    try {
      // Search for item receipt vs bill varience
      var varienceSearch = search.create({
        type: "transaction",
        filters: [
          ["type", "anyof", "ItemRcpt", "VendBill"],
          "AND",
          ["createdfrom", "anyof", poId],
          "AND",
          ["mainline", "is", "T"],
        ],
        columns: ["type", "total"],
      });

      var totalReceived = 0;
      var totalBilled = 0;

      varienceSearch.run().each(function (result) {
        var type = result.getValue({ name: "type" });
        var total = parseFloat(result.getValue({ name: "total" })) || 0;

        if (type === "ItemRcpt") {
          totalReceived += Math.abs(total);
        } else if (type === "VendBill") {
          totalBilled += Math.abs(total);
        }

        return true;
      });

      return Math.max(0, totalReceived - totalBilled);
    } catch (e) {
      log.error({
        title: "Error in calculating accrual amount" + poId,
        details: e.toString(),
      });
      return 0;
    }
  }

  function createAccrualAdjustmentJE(poValues, amount, poId) {
    try {
      var jeRecord = record.create({
        type: record.Type.JOURNAL_ENTRY,
      });

      jeRecord.setValue("subsidiary", poValues.subdiary);
      jeRecord.setValue("currency", poValues.currency);
      jeRecord.setValue(
        "memo",
        "Accrual Adjustment for PO #" + poValues.tranid + " (Auto Generated)"
      );
      jeRecord.setValue("tranid", "JE for PO " + poValues.tranid);

      // Debit: Accrual Account (GR/IR)
      jeRecord.selectNewLine({ sublistId: "line" });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "account",
        value: getAccrualAccount(poValues.subdiary), // Custom funtion to get GR/IR account
      });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "debit",
        value: accrualAmount,
      });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "memo",
        value: "Clear accrual for PO:" + poValues.tranid,
      });
      jeRecord.commitLine({ sublistId: "line" });

      // Credit: Expense Account atau COGS
      jeRecord.selectNewLine({ sublistId: "line" });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "account",
        value: getExpenseAccount(poValues.subdiary), // Custom funtion to get Expense/COGS account
      });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "credit",
        value: accrualAmount,
      });
      jeRecord.setCurrentSublistValue({
        sublistId: "line",
        fieldId: "memo",
        value: "Accrual adjusment for  PO:" + poValues.tranid,
      });
      jeRecord.commitLine({ sublistId: "line" });

      var jeId = jeRecord.save();

      log.audit({
        title: "JE Created:" + poValues.tranid,
        details:
          "JE ID: " +
          jeId +
          ", Amount: " +
          amount +
          ", PO ID: " +
          poValues.tranid,
      });

      return jeId;
    } catch (e) {
      log.error({
        title: "Error creating JE for PO:" + poId,
        details: e.toString(),
      });
      throw e;
    }
  }

  // Helper function -  perlu disesuikan dengan chart of account perusahaan
  function getAccrualAccount(subsidiaryId) {
    // Logic to determine GR/IR account based on subsidiary
    // Contoh: return 123; // ganti dengan ID GR/IR account yang sesuai
    return 123; // ganti dengan ID akun yang sesuai
  }

  function getExpenseAccountId(subsidiaryId) {
    // Return expense account ID based on subsidiary
    return 456; // ganti dengan ID akun yang sesuai
  }

  function summarize(summary) {
    try {
      var successCount = 0;
      var failedCount = 0;
      var errorDetails = [];

      context.output.iterator().each(function (key, value) {
        var result = JSON.parse(value);
        if (result.success === "SUCCESS") {
          successCount++;
        } else {
          failedCount++;
          errorDetails.push({
            poId: result.poId,
            error: result.error || null,
          });
        }
        return true;
      });

      log.audit({
        title: "Auto PO Closing Summary",
        details:
          "Total Success: " + successCount + ", Total Failed: " + failedCount,
      });

      // Send email notification if needed
      if (failedCount > 0 || successCount > 0) {
        sendSummaryEmail(successCount, failedCount, errorDetails);
      }
    } catch (e) {
      log.error({
        title: "Error in summarize",
        details: e.toString(),
      });
    }
  }

  function sendSummaryEmail(successCount, failedCount, errorDetails) {
    try {
      var subject = "Auto PO Closing Summary";
      var body =
        "Auto PO Closing Process Completed.<br/>" +
        "Total Successful Closures: " +
        successCount +
        "<br/>" +
        "Total Failed Closures: " +
        failedCount +
        "<br/>";

      if (errorDetails.length > 0) {
        body += "<br/>Error Details:<br/>";
        errorDetails.forEach(function (detail, index) {
          body +=
            index +
            1 +
            "PO ID: " +
            detail.poId +
            ", Error: " +
            (detail.error || "N/A") +
            "<br/>";
        });
      }

      email.send({
        author: runtime.getCurrentUser().id,
        recipients: "abc@company.com", // ganti dengan email yang sesuai
        subject: subject,
        body: body,
      });
    } catch (e) {
      log.error({
        title: "Error sending summary email",
        details: e.toString(),
      });
    }
  }

  return {
    getInputData: getInputData,
    map: map,
    summarize: summarize,
  };
});
