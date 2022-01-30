---
title: "Building a batch pipeline with Java #2: writing the job"
slug: bilding-a-batch-pipeline-with-java-2-writing-the-job
cover: "../thumbnails/batchprocessing.png"
category: "test3"
categories:
  - Code
  - Backend
  - Cloud
date: "01/30/2022"
thumbnail: "../thumbnails/batchprocessing.png"
tags:
  - Spring
  - Batch
  - pipeline
  - Java
time: "15 min"
---

The [first post in this series](https://s11a.com/building-a-batch-pipeline-01-crash-course-in-spring-batch) went over some fundamental concepts and interfaces we may encounter as a developer using Spring Batch. Now, let's build on those ideas to construct a full batch pipeline. Hopefully this can serve as a reference for how quickly a Spring developer can build batch jobs.

## Prerequisites

- Spring framework
- Spring Batch fundamentals. I recommend using the last post int his series as a crash-course in tandem with [Spring's docs](https://docs.spring.io/spring-batch/docs/current/reference/html/)
- Databases i.e basic relational database concepts
