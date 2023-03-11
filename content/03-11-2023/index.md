---
title: "Writing a Cosmos DB stored procedure with continuation"
slug: writing-a-cosmos-db-stored-procedure-with-continuation
cover: "../thumbnails/batchprocessing.png"
category: "test3"
categories:
  - Code
  - Backend
  - Cloud
date: "03/11/2023"
thumbnail: "../thumbnails/azure.png"
tags:
  - Azure
  - Cosmos
  - Data
  - Java
  - JavaScript
time: "5 min"
---

We will explore one of the essential features of Cosmos DB - pagination and continuation tokens. Below is a robust & practical implementation for using continuation tokens using the [JavaScript server-side SDK](https://github.com/Azure/azure-cosmosdb-js-server/) to define the procedure and the [Java client SDK](https://github.com/Azure/azure-cosmosdb-java) to execute it.

## Prerequisites

- An Azure account
- Basic JavaScript knowledge
- Basic Java knowledge

## Setting up a workspace

The code here has been hacked together from the [quickstart for java example](https://github.com/Azure-Samples/azure-cosmos-java-getting-started/blob/main/src/main/java/com/azure/cosmos/sample/sync/SyncMain.java). To create a workspace, simply use the portal to create a Cosmos DB [free tier](https://learn.microsoft.com/en-us/azure/cosmos-db/free-tier).

Once you have a Cosmos instance, set the primary key and connection strings that the program will use to create a client.

```bash
export ACCOUNT_KEY="test=="
export ACCOUNT_HOST="https://test.documents.azure.com:443/"
```

You can then run the example code in its entirety. Below we will go through the code in detail. It will:

1. Create the `ToDoList` database
2. Create the `Items` collection
3. Create the `getItems` stored procedure
4. Insert test data
5. Run the stored procedure and fetch data in pages.

## Writing the procedure

Cosmos DB stored procedures are written in JavaScript, allowing for a wide range of syntax. Using the `chain` command allows for extremely concise scripting. It takes after lodash and ECMAScript5 array functions. [This cheat sheet](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/javascript-query-api#sql-to-javascript-cheat-sheet) should give you the tools to get started.

Within a partition, the stored procedure be doing the equivalent SQL query (with pagination):

```SQL
SELECT i.address FROM items i;
```

Using the SDK the procedure definition can be written as follows:

```JavaScript
function getItems(continuation) {
    var container = getContext().getCollection();

    container
        .chain()
        .pluck("address")
        .flatten()
        .value({
            pageSize: 100,
            continuation: continuation
        }, function (err, feed, options) {
            if (err) throw err;
            getContext().getResponse().setBody({
                result: feed,
                continuation: options.continuation
            });
        });

}
```

Inspecting the definition above, within the `value()` chain we are setting the `FeedOptions` to the default `pageSize` of 100 wiring in the`continuation` token from procedure input. In the callback we set the response body to include the resulting documents in `result` field and the associated continuation token, it it exists, in the `continuation` field.

## Executing

## Summary
