'use strict';

const gPlay = require('google-play-scraper');
const fs = require('fs');

const http = require('http');
const https = require('https');
http.globalAgent.maxSockets = 1;
https.globalAgent.maxSockets = 1;

const reviewsCallAmount = 1500;
const reviewsSaveAmount = 100000;
const dynamicParams = {stopProcessing: false};

const _callList = async (params) => {
  try {
    const data = await gPlay.list({throttle: 5, ...params});
    return data.map(app => app.appId);
  } catch (e) {
    return [];
  }
};

const _callReviews = async (params) => {
  try {
    const data = await gPlay.reviews({throttle: 5, ...params});
    return data.data.map(review => ({title: review.title, text: review.text, score: review.score}));
  } catch (e) {
    return [];
  }
};

const _callReviewsWithPagination = async (params) => {
  try {
    const data = await gPlay.reviews(params);
    const reviews = data.data.map(review => ({title: review.title, text: review.text, score: review.score}));
    const nextToken = data.nextPaginationToken;
    return {reviews, nextToken};
  } catch (e) {
    return {reviews: [], nextToken: params.nextPaginationToken ? params.nextPaginationToken : true};
  }
};

const getAppIds = async (categories = Object.values(gPlay.category), collections = Object.values(gPlay.collection)) => {
  const result = [];
  for (let categoryIndex = 0; categoryIndex < categories.length; ++categoryIndex) {
    for (let collectionIndex = 0; collectionIndex < collections.length; ++collectionIndex) {
      result.push(...await _callList({collection: collections[collectionIndex], num: Number.MAX_SAFE_INTEGER}));
    }
  }
  return [...new Set(result)];
};

const getReviews = async (appIds = []) => {
  const result = [];
  for (let i = 0; i < appIds.length; ++i) {
    result.push(...await _callReviews({appId: appIds[i], num: Number.MAX_SAFE_INTEGER}));
  }
  return result;
};

const getAllReviews = async () => {

  // await fs.promises.writeFile("appsIds.json", JSON.stringify(appIds));
  // const appIds = JSON.parse(await fs.promises.readFile("appsIds.json", 'utf-8'));
  const reviews = await getReviews(appIds.slice(0, 20));
  await fs.promises.writeFile("appsReviews.json", JSON.stringify(reviews));
  console.log(JSON.stringify(reviews));
};

const processingReviews = async (fetchAppIds = false, appIdsFile = "appsIds.json") => {
  let tokenMapping = {};

  if (fetchAppIds) {
    const appIds = await getAppIds();
    appIds.forEach(id => {
      tokenMapping[id] = true;
    });
    await fs.promises.writeFile(appIdsFile, JSON.stringify(tokenMapping));
  } else {
    tokenMapping = JSON.parse(await fs.promises.readFile(appIdsFile, 'utf-8'));
  }

  let endCounter = 0;
  let iterationsCounter = 0;
  const result = [];
  while (!dynamicParams.stopProcessing && endCounter !== Object.keys(tokenMapping).length) {
    endCounter = 0;
    for (const appId in tokenMapping) {
      if (!tokenMapping[appId]) {
        delete tokenMapping[appId];
        ++endCounter;
        continue;
      }

      const {reviews, nextToken} = await _callReviewsWithPagination({
        appId,
        num: reviewsCallAmount,
        nextPaginationToken: tokenMapping[appId] === true ? null : tokenMapping[appId]
      });

      tokenMapping[appId] = nextToken;
      result.push(...reviews);

      if (result.length >= reviewsSaveAmount) {
        const toSave = result.splice(0, reviewsSaveAmount);
        await fs.promises.writeFile(`./results/result${iterationsCounter}.json`, JSON.stringify(toSave));
        await fs.promises.writeFile(appIdsFile, JSON.stringify(tokenMapping));
        ++iterationsCounter;
      }
    }
    await fs.promises.writeFile(appIdsFile, JSON.stringify(tokenMapping));
  }

  await fs.promises.writeFile(`./results/result${iterationsCounter + 1}.json`, JSON.stringify(result));
};

module.exports = {
  getAllReviews,
  processingReviews,
};