console.log("!!! SERVICE WORKER LOADING: Firebase Messaging");

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.2.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId. This came from the app's dashboard settings under Cloud Messaging.
firebase.initializeApp({
  'messagingSenderId': '962415122495'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
messaging.setBackgroundMessageHandler(function(payload) {

  console.log('setBackgroundMessageHandler in [firebase-messaging-sw.js] received background message.');
  console.log("  payload: " + JSON.stringify(payload, null, 4));

// TODO: How do we let the app know that this was received?

  // // Customize notification here
  // const notificationTitle = 'Background Message Title';
  // const notificationOptions = {
  //   body: 'Background Message body.'
  // };

  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: payload.data.icon,
    clickAction: payload.data.clickAction
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});