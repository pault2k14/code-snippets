"use strict";

const fs = require('fs');

main();

/** Coordinates computation and display of gross margin from profit and loss report
 *  params - None
 *  returns - None
 */
function main() {
    const jsonData = loadFIle("./profit-and-loss.json");

    if(!jsonData) {
        return;
    }

    if(!checkRequiredFields(jsonData)) {
        return;
    }

    const columnValues = determineColumns(jsonData);

    if(!columnValues) {
        return;
    }

    const totalIncome = getSectionValue(jsonData, "Income", columnValues.Money);
    const costOfGoodsSold = getSectionValue(jsonData, "Cost of Goods Sold", columnValues.Money);

    if(!totalIncome || !costOfGoodsSold) {
        return;
    }

    const grossMargin = calculateGrossMargin(totalIncome, costOfGoodsSold);

    console.log("Gross Margin is " + grossMargin.toFixed(2) + "%");
}


/** Loads Json Profit and Loss report from disk and converts to json
 *  param - String - reportPath - path to profit and loss report
 *  return - Object - JSON profit and loss report
 */
function loadFIle(reportPath) {
    let rawFile = null;

    try {
        rawFile = fs.readFileSync(reportPath);
    } catch (e) {
        console.err("Unable to read json profit and loss file!");
        return null;
    }

    try {
        return JSON.parse(rawFile);
    } catch(e) {
        console.err("Unable to parse json profit and loss file!");
        return null;
    }
}


/** Checks if required fields are present in the json profit and loss report
 * param - Object - jsonProfitLoss the json profit and loss report
 * return - boolean - If the profit and loss report contains all required fields
 */
function checkRequiredFields(jsonProfitLoss) {
    if(!jsonProfitLoss) {
        console.error("Json data is invalid");
        return false;
    }
    else if(!jsonProfitLoss.Header) {
        console.error("Json does not have Header object!");
        return false;
    } else if(!jsonProfitLoss.Header.Option) {
        console.error("Header does not have Option object!");
        return false;
    }

    for(let i = 0; i < jsonProfitLoss.Header.Option.length; ++i) {
        if(jsonProfitLoss.Header.Option[i].Name === "NoReportData" && jsonProfitLoss.Header.Option[i].Value === "true") {
            console.log("Json contains no report data");
            return false;
        }
    }

    if(!jsonProfitLoss.Columns) {
        console.error("Json does not have Columns object!");
        return false;
    } else if(!jsonProfitLoss.Columns.Column) {
        console.error("Columns object does not have a Column array!");
        return false;
    } else if (!jsonProfitLoss.Rows) {
        console.error("Json does not have Rows object!");
        return false;
    } else if (!jsonProfitLoss.Rows.Row) {
        console.error("Json does not have a Row array!");
        return false;
    }

    return true;
}


/** Retreives a sections dollar value from the profit and loss report
 * param - Object - jsonProfitLoss the json profit and loss report
 * param - String - groupName the name of the group to get
 * param - int - moneyIndex the index of the money column
 * return - Number - total income from the profit and loss report
 */
function getSectionValue(jsonProfitLoss, groupName, moneyIndex) {
    const rowArray = jsonProfitLoss.Rows.Row;

    for(let i = 0; i < rowArray.length; ++i) {

        if(rowArray[i].type === "Section" && rowArray[i].group === groupName) {
            return Number(rowArray[i].Summary.ColData[moneyIndex].value);
        }
    }

    console.err("Unable to get section dollar value from report!");
    return null;
}

/** Determines which columns occupy each index
 * param - Object - jsonProfitLoss the json profit and loss report
 * return - Object - determined columns
 */
function determineColumns(jsonProfitLoss) {
    const columnValues = {
        Account: null,
        Money: null
    };

    const columns = jsonProfitLoss.Columns.Column;

    for(let i = 0; i < columns.length; ++i) {
        if(columns[i].ColType === "Account") {
            columnValues.Account = i;
        } else if(columns[i].ColType === "Money") {
            columnValues.Money = i;
        }
    }

    if(columnValues.Money === null || columnValues.Account === null) {
        console.err("Unable to determine column data from json profit and loss file!");
        return null;
    } else {
        return columnValues;
    }
}


/** Calculates gross margin from the proft and loss report
 * param - Number - totalIncome the total income
 * param - Number - costOfGoods the total cost of goods
 * return - Number - gross margin percentage
 */
function calculateGrossMargin(totalIncome, costOfGoodsSold) {
    return (totalIncome - costOfGoodsSold)/totalIncome * 100;
}