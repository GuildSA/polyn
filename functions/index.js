'use strict';

// Import the Firebase SDK for Google Cloud Functions.
var functions = require('firebase-functions');

// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({origin: true});

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((req, res) => {

// NOTE: The use of cors helped here but not really needed once we told
// iron-ajax that the request is a GET. 
  //cors(req, res, () => {
     res.send("Hello from Firebase!");
  //});
});


// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {

  // Grab the 'text' parameter.
  const original = req.query.text;

  // Push it into the Realtime Database then send a response
  admin.database().ref('/messages').push({original: original}).then(snapshot => {

// NOTE: The use of cors is needed here but according to the spec, it is not 
// supposedly needed for GETs or POSTs. I'm not sure why we need it for an iron-ajax POST.
    cors(req, res, () => {
      //res.redirect(303, snapshot.ref); // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
      //res.send("SUCCESS");
      res.status(200).end();
    });

  });
});

// If we add an onWrite listener to /messages/:pushId/original, we can create an
// uppercase version of the message and save it to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original').onWrite(event => {

    // Grab the current value of what was written to the Realtime Database.
    const original = event.data.val();
    console.log('Uppercasing', event.params.pushId, original);
    const uppercase = original.toUpperCase();
    // You must return a Promise when performing asynchronous tasks inside a Functions such as
    // writing to the Firebase Realtime Database.
    // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
    return event.data.ref.parent.child('uppercase').set(uppercase);
});

exports.sendMessage = functions.https.onRequest((req, res) => {

  const registrationToken = req.query.token;
  const title = req.query.title;
  const body = req.query.body;

  let payload = {
    notification: {
      title: title,
      body: body,
      icon: "/images/firebase-logo.png",
      clickAction: "https://polyn-3c431.firebaseapp.com/"
    }
  };
  
  cors(req, res, () => {
    return admin.messaging().sendToDevice(registrationToken, payload)
      .then(function(response) {
        console.log("Successfully sent message:", response);
        res.status(200).end();
      })
      .catch(function(error) {
        console.log("Error sending message:", error);
        res.status(500).end();
      });
  });
});

exports.sendRequest = functions.https.onRequest((req, res) => {

  const categoryPath = req.query.categoryPath;
  const title = req.query.title;
  const body = req.query.body;

  let request = {
      title: title,
      body: body,
  };

  // Push it into the Realtime Database then send a response
  admin.database().ref('/requests/' + categoryPath + '/requests').push(request).then(snapshot => {

    cors(req, res, () => {
      //res.redirect(303, snapshot.ref); // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
      //res.send("SUCCESS");
      res.status(200).end();
    });
  });
});

// How to test:
// Function URL (helloWorld): https://us-central1-polyn-3c431.cloudfunctions.net/helloWorld
// Function URL (addMessage): https://us-central1-polyn-3c431.cloudfunctions.net/addMessage

// Notes:
// https://github.com/firebase/functions-samples
// https://codelabs.developers.google.com/codelabs/firebase-cloud-functions/#9

