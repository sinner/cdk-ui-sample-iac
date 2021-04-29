/* eslint-disable */
"use strict";
const http = require('https');

const indexPage = 'index.html';

exports.handler = async (event, context, callback) => {
  const cf = event.Records[0].cf;
  const request = cf.request;
  const response = cf.response;
  const statusCode = response.status;

  console.log('My Site - Lambda Edge v1.0.5 - ', request.uri);

  // Only replace 403 and 404 requests typically received
  // when loading a page for a SPA that uses client-side routing
  const shouldReplace = doReplace(request, statusCode);
  if (shouldReplace) {
    console.log('My Site - CF Raw Response Headers: ', response.headers);
  }

  const result = shouldReplace && !isAnActualNotFoundError(request.uri) ? await generateResponseAndLog(cf, request, response, indexPage) : response;

  getSecurityHeaders(result.headers);

  callback(null, result);
};

function doReplace(request, statusCode) {
  try {
    const reqAndResCondition = request.method === 'GET' && (statusCode == 403 || statusCode == 404);
    return reqAndResCondition;
  } catch (e) {
    console.log('My Site - Error on DoReplace Condition: ', request.uri, ' -- ', e.message);
  }
}

/**
 * We will consider an actual 404 error when the URI ends with the list of extensions that we can see here
 *  .css|.js|.json|.html|.txt|.ico|.png|.jpg|.jpeg|.svg|.webp|.gif|.mov
 *  .mp4|.avi|.webm|.mkv|.ogg|.wmv|.csv|.xlsx|.xls|.font|.eot|.woff
 * 
 * @param {string} uri 
 * @returns 
 */
 function isAnActualNotFoundError(uri) {
  let extensionCondition = false;
  try {
    const cleanURI = uri.split('?')[0] || '';

    extensionCondition = cleanURI && new RegExp('(.css|.js|.json|.html|.txt|.ico|.png|.jpg|.jpeg|.svg|.webp|.gif|.mov|.mp4|.avi|.webm|.mkv|.ogg|.wmv|.csv|.xlsx|.xls|.font|.eot|.woff)$').test(cleanURI.toLowerCase());
  } catch (e) {
    console.log('My Site - Error on isAnActualNotFoundError Condition: ', e.message, JSON.stringify(e));
  }
  return extensionCondition;
}

async function generateResponseAndLog(cf, request, response, indexPage){

  const domain = cf.config.distributionDomainName;
  const indexPath = `/${indexPage}`;

  await generateResponse(domain, response, indexPath);

  console.log('My Site - Response: ' + JSON.stringify(response));

  return response;
}

async function generateResponse(domain, response, path){
  try {
    // Load HTML index from the CloudFront cache
    const s3Response = await httpGet({ hostname: domain, path: path });
    response.status = 200;
    response.statusDescription = 'OK';
    getSecurityHeaders(response.headers);
    response.headers['content-type'] = [{ key: 'Content-Type', value: 'text/html;charset=UTF-8' }];
    response.body = s3Response.body;

    return response;
  } catch (error) {
    response.status = 500;
    response.statusDescription = 'Error';
    response.headers['content-type'] = [{ key: 'Content-Type', value: 'text/html;charset=UTF-8' }];
    response.body = 'My Site - An error occurred loading the page.';
    console.log(`My Site - Error - generateResponse - ${error.message}`);
    return response;
  }
}

function httpGet(params) {
  return new Promise((resolve, reject) => {
    http.get(params, (resp) => {
      console.log(`My Site - Fetching ${params.hostname}${params.path}, status code : ${resp.statusCode}`);
      const result = {
          headers: resp.headers,
          body: ''
      };
      resp.on('data', (chunk) => { result.body += chunk; });
      resp.on('end', () => { resolve(result); });
    }).on('error', (err) => {
      console.log(`My Site - Couldn't fetch ${params.hostname}${params.path} : ${err.message}`);
      reject(err, null);
    });
  });
}

function getSecurityHeaders(responseHeaders) {
  if (!responseHeaders) {
    return;
  }

  responseHeaders['strict-transport-security'] = [{
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }];

  responseHeaders['content-security-policy'] = [{
    key: 'Content-Security-Policy',
    value: "default-src 'self'; font-src 'self' fonts.gstatic.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; script-src 'self' www.google.com www.gstatic.com 'unsafe-eval'; connect-src 'self' https://*.mockapi.io"
  }];

  responseHeaders['x-xss-protection'] = [{
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }];

  responseHeaders['x-content-type-options'] = [{
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }];

  responseHeaders['x-frame-options'] = [{
    key: 'X-Frame-Options',
    value: 'DENY'
  }];

  return responseHeaders;
}
