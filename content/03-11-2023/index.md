---
title: "Writing a Cosmos DB stored procedure with continuation"
slug: writing-a-cosmos-db-stored-procedure-with-continuation
cover: "../thumbnails/azure.png"
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

We will explore one of the essential features of Cosmos DB - pagination and continuation tokens. Below is a brief look at a robust & practical implementation for using continuation tokens in a stored procedure. We will use the [JavaScript server-side SDK](https://github.com/Azure/azure-cosmosdb-js-server/) to define the procedure and the [Java client SDK](https://github.com/Azure/azure-cosmosdb-java) to execute it.

## Prerequisites

- An Azure account
- Basic JavaScript knowledge
- Basic Java knowledge

## Setting up a workspace

The code here has been hacked together from the [quick start for java example](https://github.com/Azure-Samples/azure-cosmos-java-getting-started/blob/main/src/main/java/com/azure/cosmos/sample/sync/SyncMain.java). To create a workspace, simply use the portal to create a Cosmos DB [free tier](https://learn.microsoft.com/en-us/azure/cosmos-db/free-tier).

Once you have a Cosmos instance, set the primary key and connection strings that the program will use to create a client.

```bash
export ACCOUNT_KEY="test=="
export ACCOUNT_HOST="https://test.documents.azure.com:443/"
```

You can then run the example code. [It can be found here](https://github.com/snimmagadda1/azure-cosmos-stored-procedure-pagination-continuation) in its entirety. Below we will go through the code. It will:

1. Create the `ToDoList` database
2. Create the `Items` collection
3. Create the `getItems` stored procedure
4. Insert test data
5. Run the stored procedure and fetch data in pages.

## Writing the procedure

Cosmos DB stored procedures are written in JavaScript. This allows for a wide range of syntax. The `chain` command allows for extremely concise scripting. The syntax is modeled after lodash and ECMAScript5 array functions. [This cheat sheet](https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/javascript-query-api#sql-to-javascript-cheat-sheet) should give you the tools to get started writing with it.

Within a partition the stored procedure be doing the equivalent SQL query (with pagination):

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

Within the chain's terminating `value()` we are setting the `FeedOptions` to the default `pageSize` of 100 wiring in the `continuation` token from procedure input. In the callback we set the response body to include the resulting documents in `result` field and the associated continuation token, it it exists, in the `continuation` field.

The full server-side JS API can be found [here](http://azure.github.io/azure-cosmosdb-js-server/index.html).

## Executing

On the client side, we will call the stored procedure to fetch all the addresses within the collection. The first call will have no arguments. After the client receives a response, it should inspect it for a continuation token, and call again until the final result is available (no continuation token returned). This pattern is the driver for pagination, or continuing updates in a stored procedure.

Using the Java client SDK, that pattern looks like the following in the function `runProcedureContinuation`:

```Java
private void runProcedureContinuation() throws Exception {
  storedProcedure = container
          .getScripts()
          .getStoredProcedure(storedProcName);

  List<Address> fetched = new ArrayList<>();
  GetItemsProcedureResponse response = runStoredProcedure(null);
  fetched.addAll(response.getResult());
  if (StringUtils.isNotBlank(response.getContinuation())) {
      String continuation = response.getContinuation();
      System.out.printf("Got initial response with continuation %s\n", continuation);
      int attempts = 0;
      while (StringUtils.isNotBlank(continuation) && attempts < MAX_QUERIES) {
          GetItemsProcedureResponse page = runStoredProcedure(continuation);
          fetched.addAll(page.getResult());
          continuation = page.getContinuation();
          System.out.printf("Got response with continuation %s\n", continuation);
          attempts++;
      }
      System.out.printf("Fetched %d addresses from collection in %d attempts\n",
              fetched.size(),
              attempts);
  }

}

private GetItemsProcedureResponse runStoredProcedure(String continuation) throws Exception {
  List<Object> input = new ArrayList<Object>();
  if (StringUtils.isNotBlank(continuation)) {
      input.add(continuation);
  }

  CosmosStoredProcedureRequestOptions options = new CosmosStoredProcedureRequestOptions();
  options.setPartitionKey(
          new PartitionKey("Anderson"));

  CosmosStoredProcedureResponse response = storedProcedure.execute(
          input,
          options);

  return mapper.readValue(response.getResponseAsString(),
          GetItemsProcedureResponse.class);
}

```

I've put together example code that demonstrates the process [here](https://github.com/snimmagadda1/azure-cosmos-stored-procedure-pagination-continuation). Simply clone, set the env vars for your cosmos instance, package, and then run it to inspect the output of the procedure calls:

```log
INFO: Getting database account endpoint from https://XXXX.documents.azure.com:443/
Create database ToDoList if not exists.
Checking database ToDoList completed!

Create container Items if not exists.
Checking container Items completed!

Scaling container Items.
Scaled container to 600 completed!
Created item with request charge of 10.29 within duration PT0.422883S
Created item with request charge of 15.43 within duration PT0.027728S

... (log output abbreviated) ...

Got initial response with continuation -RID:~QoESALqhssxkAAAAAAAAAA==#RT:1#TRC:100#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhsszIAAAAAAAAAA==#RT:2#TRC:200#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhsswsAQAAAAAAAA==#RT:3#TRC:300#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhssyQAQAAAAAAAA==#RT:4#TRC:400#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhssz0AQAAAAAAAA==#RT:5#TRC:500#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhssxYAgAAAAAAAA==#RT:6#TRC:600#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhssy8AgAAAAAAAA==#RT:7#TRC:700#ISV:2#IEO:65567#QCF:8
Got response with continuation -RID:~QoESALqhssw0CAAAAAAAAA==#RT:21#TRC:2100#ISV:2#IEO:65567#QCF:8
Fetched 900 addresses from collection in 9 attempts
Demo complete, please hold while resources are released
Closing the client
```

## Summary

Above we used the JavaScript server-side SDK to define a stored procedure that uses continuation. We then orchestrate our client to call the stored procedure in a looping pattern to obtain all the results. There are many variations on this approach depending on the operation(s) being done.
