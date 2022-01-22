---
title: "Making garlic bot 'randomer' with a self scheduling lambda"
slug: making-garlic-bot-randomer-with-a-self-scheduling-lambda
cover: "../images/lambda_cover.png"
category: "test3"
categories:
  - Code
  - Backend
  - Cloud
date: "01/28/2022"
thumbnail: "../thumbnails/lambda.png"
tags:
  - AWS
  - CloudWatch
  - EventBridge
  - Lambda
  - Serverless
time: "5 min"
---

On a snowy day a while back I threw together [Twitter 'bot'](https://twitter.com/GarlicHub) to randomly retweet things about garlic. It is glorious, and to-date serves garlic content to 250+ individuals:

![Spring batch functional architecture](../images/garlic_bot_twitter.png)

It has a problem though - *it isn't totally random*.