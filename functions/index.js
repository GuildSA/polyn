'use strict';

// Import the Firebase SDK for Google Cloud Functions.
var functions = require('firebase-functions');

const GeoFire = require('geofire');

// CORS Express middleware to enable CORS Requests.
const cors = require('cors')({origin: true});

// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((req, res) => {

//   cors(req, res, () => {
//      res.send("Hello from Firebase!");
//   });
// });


// // Take the text parameter passed to this HTTP endpoint and insert it into the
// // Realtime Database under the path /messages/:pushId/original
// exports.addMessage = functions.https.onRequest((req, res) => {

//   // Grab the 'text' parameter.
//   const original = req.query.text;

//   // Push it into the Realtime Database then send a response
//   admin.database().ref('/messages').push({original: original}).then(snapshot => {

// // NOTE: The use of cors is needed here but according to the spec, it is not 
// // supposedly needed for GETs or POSTs. I'm not sure why we need it for an iron-ajax POST.
//     cors(req, res, () => {
//       //res.redirect(303, snapshot.ref); // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//       //res.send("SUCCESS");
//       res.status(200).end();
//     });

//   });
// });

// // If we add an onWrite listener to /messages/:pushId/original, we can create an
// // uppercase version of the message and save it to /messages/:pushId/uppercase
// exports.makeUppercase = functions.database.ref('/messages/{pushId}/original').onWrite(event => {

//     // Grab the current value of what was written to the Realtime Database.
//     const original = event.data.val();
//     console.log('Uppercasing', event.params.pushId, original);
//     const uppercase = original.toUpperCase();
//     // You must return a Promise when performing asynchronous tasks inside a Functions such as
//     // writing to the Firebase Realtime Database.
//     // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
//     return event.data.ref.parent.child('uppercase').set(uppercase);
// });

exports.sendMessage = functions.https.onRequest((req, res) => {

  const registrationToken = req.query.token;
  const title = req.query.title;
  const body = req.query.body;

  // If you use notification over data - setBackgroundMessageHandler will not fire.
  const payload = {
    //notification: {
    data: {
      title: title,
      body: body,
      icon: "/images/vr-msg.png",
      clickAction: "https://vinylrecords.io/"
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

exports.claimBusiness = functions.https.onRequest((req, res) => {

  const name = req.query.name;
  const email = req.query.email;
  const phone = req.query.phone;
  const userUid = req.query.userUid;
  const sellerKey = req.query.sellerKey;

  console.log("name: ", name);
  console.log("email: ", email);
  console.log("phone: ", phone);
  console.log("userUid: ", userUid);
  console.log("sellerKey: ", sellerKey);

  const claim = {
    name: name,
    email: email,
    phone: phone,
    userUid: userUid,
    sellerKey: sellerKey
  };

  // Add the claim to the database just in case the email to the admin fails.
  admin.database().ref('/claims').push(claim).then(snapshot => {

    cors(req, res, () => {
// TODO: Send email to admin to verify this business owner!
// https://github.com/bojand/mailgun-js
      res.status(200).end();
    });
      
  }, function(error) {
    console.error(error);
    // Failed to push new request!
    res.status(500).end();
  });
});

exports.sendRequestLocation = functions.https.onRequest((req, res) => {

  const categoryPath = req.query.categoryPath;
  const title = req.query.title;
  const desc = req.query.desc;
  const shipping = req.query.shipping;
  const buyerId = req.query.buyerId;
  const buyer = req.query.buyer;
  const requestId = req.query.requestId;

  const lat = parseFloat(req.query.lat);
  const long = parseFloat(req.query.long);
  const rangeInKm = parseFloat(req.query.rangeInKm);

  console.log("lat: ", lat);
  console.log("long: ", long);
  console.log("rangeInKm: ", rangeInKm);

  const request = {
    title: title,
    desc: desc,
    shipping: shipping,
    buyer: buyer,
    buyerId: buyerId,
    requestId: requestId,
    timeStamp: admin.database.ServerValue.TIMESTAMP
  };

  // Add the request under the given category.
  // TODO: So far, adding this to the database serves no purpose. Should we keep it?
  admin.database().ref('/requests/' + categoryPath + '/requests').push(request).then(snapshot => {
    cors(req, res, () => {

      const sellersByLocationRef = admin.database().ref("locations/" + categoryPath + "/");
      const geoFireSellersRef = new GeoFire(sellersByLocationRef);

      const geoQuery = geoFireSellersRef.query({
        center: [lat, long],
        radius: rangeInKm // Kilometers
      });

      const onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, location) {
        console.log(key + " entered the query.");
        console.log("location: " + JSON.stringify(location, null, 4));

        // Use the location key to get the seller key under the target categoryPath.
        admin.database().ref('/requests/' + categoryPath + '/sellers/' + key).once('value').then(function(snapshot) {

// At this point the attempt to send a request is bascially a 'success' even though there maybe no sellers actually listening.
          res.status(200).end();

          const sellerKey = snapshot.val();

          if(sellerKey) {
            console.log("sellerKey: " + JSON.stringify(sellerKey, null, 4));

            // The sellerKey points to the User's ID so we can get their info.
            admin.database().ref('/users/' + sellerKey + '/info').once('value').then(function(snapshot) {

              const usersInfo = snapshot.val();

              // Use the User's info to get their token and send a message.
              if(usersInfo) {
                
                // For our seller, add the request to the user's 'requests' key.
                const request = {
                  title: title,
                  desc: desc,
                  shipping: shipping,
                  buyer: buyer,
                  buyerId: buyerId,
                  requestId: requestId,
                  timeStamp: admin.database.ServerValue.TIMESTAMP
                };

                admin.database().ref('/users/' + sellerKey + '/requests').push(request).then(snapshot => {

                  console.log("token = " + usersInfo.token);

                  // If you use notification over data - setBackgroundMessageHandler will not fire.
                  const payload = {
                    //notification: {
                    data: {
                      title: title,
                      body: desc,
                      icon: "/images/vr-msg.png",
                      clickAction: "https://vinylrecords.io/"
                    }
                  };

                  admin.messaging().sendToDevice(usersInfo.token, payload)
                  .then(function(response) {
                    console.log("Successfully sent message:", response);
                  })
                  .catch(function(error) {
                    console.log("Error sending message:", error);
                  });
                });
              } else {
                console.log("usersInfo: null");
              }
            });

          } else {
            console.log("sellerKey: null");
          }
        }, function(error) {
          console.error(error);
          // Failed to get sellers for the category!
          res.status(500).end();
        });
      });

      const onReadyRegistration = geoQuery.on("ready", function() {
        console.log("  The 'ready' event fired - cancelling query.");
        geoQuery.cancel();
      })
    }); // End cors...

  }, function(error) {
    console.error(error);
    // Failed to push new request!
    res.status(500).end();
  });
});

exports.sendRequestAll = functions.https.onRequest((req, res) => {

  const categoryPath = req.query.categoryPath;
  const title = req.query.title;
  const desc = req.query.desc;
  const shipping = req.query.shipping;
  const buyerId = req.query.buyerId;
  const buyer = req.query.buyer;
  const requestId = req.query.requestId;

  const request = {
    title: title,
    desc: desc,
    shipping: shipping,
    buyer: buyer,
    buyerId: buyerId,
    requestId: requestId,
    timeStamp: admin.database.ServerValue.TIMESTAMP
  };

  // Add the request under the given category.
  // TODO: So far, adding this to the database serves no purpose. Should we keep it?
  admin.database().ref('/requests/' + categoryPath + '/requests').push(request).then(snapshot => {
    cors(req, res, () => {

      // Get all the sellers for this category.
      admin.database().ref('/requests/' + categoryPath + '/sellers').once('value').then(function(snapshot) {

        // At this point the attempt to send a request is bascially a 'success' even though there maybe no sellers actually listening.
        res.status(200).end();

        // For each seller - get their user ID.
        snapshot.forEach(function(childSnapshot) {

          const childKey = childSnapshot.key;
          const childData = childSnapshot.val();

          console.log(childKey + " = " + childData); // The childData is the user's ID who wants the message!

          // Use the User's ID to get their info.
          admin.database().ref('/users/' + childData + '/info').once('value').then(function(snapshot) {

            const usersInfo = snapshot.val();

            // Use the User's info to get their token and send a message.
            if(usersInfo) {
              
              // For our seller, add the request to the user's 'requests' key.
              let request = {
                title: title,
                desc: desc,
                shipping: shipping,
                buyer: buyer,
                buyerId: buyerId,
                requestId: requestId,
                timeStamp: admin.database.ServerValue.TIMESTAMP
              };

              admin.database().ref('/users/' + childData + '/requests').push(request).then(snapshot => {

                console.log("token = " + usersInfo.token);

                // If you use notification over data - setBackgroundMessageHandler will not fire.
                const payload = {
                  //notification: {
                  data: {
                    title: title,
                    body: desc,
                    icon: "/images/vr-msg.png",
                    clickAction: "https://vinylrecords.io/"
                  }
                };

                admin.messaging().sendToDevice(usersInfo.token, payload)
                .then(function(response) {
                  console.log("Successfully sent message:", response);
                })
                .catch(function(error) {
                  console.log("Error sending message:", error);
                });
              });
            } else {
              // usersInfo was null!
              console.log("Error sending message: usersInfo was null!");
            }
          });
        });
      }, function(error) {
        console.error(error);
        // Failed to get sellers for the category!
        res.status(500).end();
      });
    }); // End cors...

  }, function(error) {
    console.error(error);
    // Failed to push new request!
    res.status(500).end();
  });
});
