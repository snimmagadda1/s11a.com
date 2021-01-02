---
title: "A Spring Batch Quickstarter"
slug: a-spring-batch-quickstarter
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
    - Code
    - Backend
    - Cloud
date: "01-03-2021"
thumbnail: "../thumbnails/batch.png"
tags:
    - Spring
    - Batch
    - pipeline
    - Java
---

## What's the deal with Spring Batch?

Spring Batch is touted as the [leading batch framework for the JVM](https://twitter.com/springbatch?lang=enhttps://twitter.com/springbatch?lang=en). I personally haven't used many batch frameworks in Java, but it wouldn't necessarily be the first language I'd think of when implementing a batch pipeline. Historically Cobol would have been the tool of choice and is still in place in the industry today. Nowadays something with a lower barrier to entry like python or scala seems logical. So why even use it?

Since [Accenture and SpringSource](https://newsroom.accenture.com/subjects/technology/accenture-and-springsource-team-to-deliver-production-version-open-source-framework-for-batch-processing.htm) brought the project to life about ten years ago, Spring Batch has evolved into a framework that does its job well; it encourages sensible architecture and promotes reuse and maintanability within a toolset many enterprise developers are familiar with. By following the format of ETL closely with the reader-processor-writer pattern, you get a lot of things "for free". Things like fault-tolerance, intelligent job restarts and chunk-based processing come with little to no configuration. If your use case truly calls for batch jobs, you might consider using this framework because of its flexibility and ability to handle complex, high-volume tasks. In my case, the team felt maintainability and ease of use were paramount which led us to choose Spring Batch.

I had never used the framework before nor had I used Spring Cloud Dataflow, which is a "nice-to-have" orchestration tool for your batch jobs. However, I truly believe a single readthrough of the docs [here](https://docs.spring.io/spring-batch/docs/current/reference/html/index.html) gives a developer everything they need to get up and running with Spring batch. I would highly recommend some of the earlier portions of the batch documentation Spring provides which does a great job explaining the domain language of batch.

Logically, I went to see [some of the examples spring provides](https://github.com/spring-projects/spring-batch/tree/master/spring-batch-samples) and was a bit disappointed to see that they were XML based 😞. It also isn't super clear how to get these jobs ready for orchestration with the dataflow server. After bit of analysis, trial and error and a few production deployments, I've put together a flexible project base for getting up and running with Spring Batch [here](https://github.com/snimmagadda1/spring-batch-rapid-starter). Jobs developed with the template are also ready for orchestration with Spring Cloud Dataflow via the `@EnableTask` annotation and configuration properties.

You can run the rapid-starter out of the box with maven (`mvn spring-boot:run`) or as a jar to see the result (read names from CSV and write capitalized to another CSV). The starter also includes a functioning integration test that can be extended

The template has the following package structure:

-   `com.batch.config`: This parent directory holds configuration items for the job, primarily in the form of Spring beans. Definitions for commonly used spring items like datasources and transaction managers along with batch specific objects like readers & writers should go here. The use of prefix-based configuration with `@ConfigurationProperties` allows for consturction of dynamic jobs.
    -   `com.batch.config.db`: Datasource configuration for the batch framework and app logic exist here. Spring batch (and optionally Spring cloud task) require a DB to output metrics to. The starter sets up separate transaction managers to allow for this.
    -   `com.batch.config.readers`: Define reader definitions and properties here
    -   `com.batch.config.writers`: Define writer definitions and properties here
    -   `com.batch.config.batch`: The job definition exists in this package. Here the starter wires up the `spring.datasource` to the task and batch framework for metric output in the class `SpringConfigurerConfig`. Reader, writer and processors are then autowired into the class `BatchConfig` and used for step and job definitions.

*   `com.batch.model`: Model definitions for application logic should go here. An example model `Person` exists.
*   `com.batch.processor`: Define processors here. An example processor that capitalizes A `Person` first and last name exists.

Hopefully this comes in handy down the road for others.
