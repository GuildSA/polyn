
// https://github.com/firebase/geofire-js/blob/master/examples/html5Geolocation/index.html
// https://medium.freecodecamp.com/javascript-modules-a-beginner-s-guide-783f7d7a5fcc

var GeofireManager = (function() {
  "use strict";

  var _firebaseRef;
  var _geoFire;
  var _usersGeolocationCallback;

  // Uses the HTML5 geolocation API to get the current user's location.
  var getUsersLocation = function(usersInfoKeyPath, usersGeolocationCallback) {

    _usersGeolocationCallback = usersGeolocationCallback;

    _firebaseRef = firebase.app("polyn-app").database().ref(usersInfoKeyPath);

    // Create a new GeoFire instance pointing at the user's data.
    _geoFire = new GeoFire(_firebaseRef);

    if(typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
      log("Asking user to get their location");
      navigator.geolocation.getCurrentPosition(geolocationCallback, errorHandler);
    } else {
      log("The user's browser does not support the HTML5 Geolocation API!")
    }
  };
  
  // Callback method from the geolocation API which receives the current user's location.
  var geolocationCallback = function(location) {

    var latitude = location.coords.latitude;
    var longitude = location.coords.longitude;
    log("Retrieved user's location: [" + latitude + ", " + longitude + "]");

    var locationKey = "location";
    _geoFire.set(locationKey, [latitude, longitude]).then(function() {

      log("Current user's location has been added to GeoFire");

      // When the user disconnects from Firebase (e.g. closes the app, exits the browser),
      // remove their GeoFire location entry
      _firebaseRef.child(locationKey).onDisconnect().remove();

      if(_usersGeolocationCallback) {
        _usersGeolocationCallback(location);
      }

      log("Added handler to remove user from GeoFire when you leave this page.");

    }).catch(function(error) {
      log("Error adding user location to GeoFire");
    });
  }

  // Handles any errors from trying to get the user's current location.
  var errorHandler = function(error) {

    if(error.code == 1) {
      log("Error: PERMISSION_DENIED: User denied access to their location");
    } else if(error.code === 2) {
      log("Error: POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
    } else if(error.code === 3) {
      log("Error: TIMEOUT: Calculating the user's location too took long");
    } else {
      log("Unexpected error code")
    }
  };
  
  function log(message) {
    console.log("GeofireManager: " + message);
  }

  // Define the public interface by explicitly revealing public pointers to the 
  // our private functions.
  return {
    getUsersLocation: getUsersLocation
  }

})();
