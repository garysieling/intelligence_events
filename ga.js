var auth = {};

var clientId = auth.web.client_id;
var apiKey = '';
var scopes = 'https://www.googleapis.com/auth/analytics.readonly';

function loadLib() {
  gapi.client.load('analytics', 'v3', makeApiCall);
}

function handleClientLoad() {
  // 1. Set the API Key
  gapi.client.setApiKey(apiKey);

  // 2. Call the function that checks if the user is Authenticated. This is defined in the next section
  window.setTimeout(checkAuth,5);
}

function checkAuth() {
  // Call the Google Accounts Service to determine the current user's auth status.
  // Pass the response to the handleAuthResult callback function
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
  if (authResult) {
    // The user has authorized access
    // Load the Analytics Client. This function is defined in the next section.
    loadAnalyticsClient();
  } else {
    // User has not Authenticated and Authorized
    handleUnAuthorized();
  }
}

function handleAuthClick(event) {
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function handleAuthorized() {
  var authorizeButton = document.getElementById('authorize-button');
  var makeApiCallButton = document.getElementById('make-api-call-button');

  // Show the 'Get Visits' button and hide the 'Authorize' button
  makeApiCallButton.style.visibility = '';
  authorizeButton.style.visibility = 'hidden';

  // When the 'Get Visits' button is clicked, call the makeAapiCall function
  makeApiCallButton.onclick = makeApiCall;
}


// Unauthorized user
function handleUnAuthorized() {
  var authorizeButton = document.getElementById('authorize-button');
  var makeApiCallButton = document.getElementById('make-api-call-button');

  // Show the 'Authorize Button' and hide the 'Get Visits' button
  makeApiCallButton.style.visibility = 'hidden';
  authorizeButton.style.visibility = '';

  // When the 'Authorize' button is clicked, call the handleAuthClick function
  authorizeButton.onclick = handleAuthClick;
}

$(document).ready(handleClientLoad);
$(document).ready(loadAnalyticsClient);

function loadAnalyticsClient() {
  // Load the Analytics client and set handleAuthorized as the callback function
  gapi.client.load('analytics', 'v3', handleAuthorized);
}


var groupByList = ['domain'];

var TABLE_ID = 'UA-1570898-2';
function makeApiCall(q, cb) {
  queryAccounts(q, cb);
}

function queryAccounts(q, cb) {
  console.log('Querying Accounts.');

  // Get a list of all Google Analytics accounts for this user
  gapi.client.analytics.management.accounts.list().execute(function(results){ handleAccounts(results, q, cb) });
}

function handleAccounts(results, q, cb) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first Google Analytics account
      var firstAccountId = results.items[0].id;

      // Query for Web Properties
      queryWebproperties(firstAccountId, q, cb);

    } else {
      console.log('No accounts found for this user.')
    }
  } else {
    console.log('There was an error querying accounts: ' + results.message);
  }
}

function queryWebproperties(accountId, q, cb) {
  console.log('Querying Webproperties.');

  // Get a list of all the Web Properties for the account
  gapi.client.analytics.management.webproperties.list({'accountId': accountId}).execute(
	function(result){ handleWebproperties(result, q, cb) } );
}

function handleWebproperties(results, q, cb) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first Google Analytics account
      var firstAccountId = results.items[1].accountId;

      // Get the first Web Property ID
      var firstWebpropertyId = results.items[1].id;

      // Query for Profiles
      queryProfiles(firstAccountId, firstWebpropertyId, q, cb);

    } else {
      console.log('No webproperties found for this user.');
    }
  } else {
    console.log('There was an error querying webproperties: ' + results.message);
  }
}

function queryProfiles(accountId, webpropertyId, q, cb) {
  console.log('Querying Profiles.');

  // Get a list of all Profiles for the first Web Property of the first Account
  gapi.client.analytics.management.profiles.list({
      'accountId': accountId,
      'webPropertyId': webpropertyId
  }).execute(function(results){ handleProfiles(results, q, cb) });
}

function handleProfiles(results, q, cb) {
  if (!results.code) {
    if (results && results.items && results.items.length) {

      // Get the first Profile ID
      var firstProfileId = results.items[0].id;

      // Step 3. Query the Core Reporting API
      queryCoreReportingApi(firstProfileId, q, cb);

    } else {
      console.log('No profiles found for this user.');
    }
  } else {
    console.log('There was an error querying profiles: ' + results.message);
  }
}

function queryCoreReportingApi(profileId, q, cb) {
  console.log('Querying Core Reporting API.');

var query = $.extend(q, {
    'ids': 'ga:' + profileId
  })
;
console.log('Query: ' + JSON.stringify(query));
console.log('Query: ' + JSON.stringify(q));
  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get(
  query).execute(cb);
}

loadLib();
