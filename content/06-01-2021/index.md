---
title: "Building a pipeline with Spring Batch"
slug: batch-processing-in-java-with-spring-batch
cover: "https://unsplash.it/400/300/?random?AngelsofMist"
category: "test3"
categories:
    - Code
    - Backend
    - Cloud
date: "06/01/2021"
thumbnail: "../thumbnails/batchprocessing.png"
tags:
    - Spring
    - Batch
    - pipeline
    - Java
isdev: true
---

The last post took look at a Spring Batch project template to get off the ground quickly. In this one we're going to take it a step further and use the starter to build out a batch job. We won't focus too much here on the implementation of the framework itself ([docs do a good job of that](https://docs.spring.io/spring-batch/docs/4.3.x/reference/html/domain.html#domainLanguageOfBatch)), but rather practical use-cases to quickly enable yourself to build robust batch apps for enterprise apps.

## Prerequisites
You must have a general knowledge of Java for this guide. Along with that, knowledge of the following is very beneficial:
- Spring framework (IoC, beans, context, etc)
- Databases
- Docker (not required but useful for running locally)

We will do a quick overview of some of the primary components that you'll work with in Spring Batch. Depending on your use case, you may want to dig around [the official docs](https://spring.io/projects/spring-batch#learn) for additional info. 

## Goals
In this walkthrough, we will build a modest, multi-threaded batch pipeline. It will read a directory of files (XML data dumps from Stack Exchange), perform some processing, and write to a relational DB (MySQL). Here is the link to the full source:

- [**Source**](https://github.com/snimmagadda1/stack-exchange-dump-to-mysql)

## Intro to batch processing
If you're someone looking for a refresher in the strategies and principles of batch processing, I would recommend a read-through of Spring's batch introduction [here](https://docs.spring.io/spring-batch/docs/current/reference/html/spring-batch-intro.html#spring-batch-intro). I found this portion of their docs super helpful. It does a great job providing background on batch processing and translating that to Spring Batch's architecture.

## Understanding Spring Batch ... enough to get started
Like most-things-Spring, the framework comes with a lot built for you out of the box and you can get [running pretty quickly](https://spring.io/guides/gs/batch-processing/). Adding `@EnableBatchProcessing` to your spring app gives you everything you need to code with for free (magic). Personal experience has taught me it's best to have a decent grasp on Spring's implementation of whatever you're using. We'll use the following diagram to quickly go through the way Spring implements batch.

![Spring batch functional architecture](../images/spring-batch-architecture.png)

The diagram depicts a broad lifecycle of a Spring Batch job. In summary, any external trigger could interact with the `JobLauncher`, which is responsible for kicking off a `Job`. As jobs are triggered and run, metadata and progress is reported to a datastore via the `JobRepository`. A developer defines isolated steps that handle their own reads, processing, and writes from N inputs and outputs.

The above isn't a comprehensive architecture diagram (theres some additional classes & interfaces exposed by the framework) but it should give you a baseline of what you're working with:

- **A `Job` is the object Spring gives you to configure and declare a batch pipeline.** 
  
  It comes with some configuration options you can tune restartability, step order, etc. To define your job, you'll want to use the provided `JobBuilderFactory`. Doing so will give you access to some handy builder syntax to create simple job definitions. We can define paths of execution (in the form of `Steps` or `Flow`s) to descrobe or batch logic:

    ```java
        @Bean
        public Job coolBatchJob() {
            return jobBuilderFactory
                    .get("coolBatchJob")
                    .flow(stepA())
                    .end()
                    .build();
        }
    ```

  In the above snippet, we're definine a job called `coolBatchJob` and kicking it off with a single step. That step is coming from a method `stepA()` that returns an object of type `Step`. Most batch pipelines consist of multiple steps with triggers and even conditional logic. The builder allows us to define this with ease. In this example, our pipeline runs its "happy path" of `stepA` followed by a seqence of steps; however, we've also defined an alternate step to run if `stepA` returns an ending status of `NOTIFY`:

    ```java
        @Bean
        public Job coolBatchJob() {
            return jobBuilderFactory
                    .get("coolBatchJob")
                    .start(stepA())
                    .on("NOTIFY")
                        .to(failure())
                    .from(stepA())
                    .on("COMPLETED")
                        .to(flow1())
                        .next(flow2())
                    .end()
                    .build();
        }
    ```

&nbsp;
&nbsp;
  
- **A `Step` represents an independent unit of work.** Spring doesn't impose too many restrictions on how a step must be implemented. A step could be as easy as reading from a file and writing to a table in a DB. A more complicated step might read a file with different entities, apply some business logic, and write the aggregate somewhere. Just like a job has a `JobExecution` object holding metadata for each run, a step has a `StepExecution` with some more granular fields like readCount, errorCount, startTime, etc.


    You'll want to be familiar with the process of defining and fine tuning a step






## Setting up the job's "wiring"

.... When starting a project I like to be explicit:

```java
    @Bean
    BatchConfigurer batchConfigurer(@Qualifier("springDataSource") DataSource dataSource) {
        return new DefaultBatchConfigurer(dataSource);
    }
```