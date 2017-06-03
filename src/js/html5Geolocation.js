
// https://github.com/firebase/geofire-js/blob/master/examples/html5Geolocation/index.html
// https://medium.freecodecamp.com/javascript-modules-a-beginner-s-guide-783f7d7a5fcc

var HTML5GeoLocation = (function() {

  var firebaseRef;
  var geoFire;

  /* Uses the HTML5 geolocation API to get the current user's location */
  var getLocation = function(usersLocationPath) {

    firebaseRef = firebase.app("polyn-app").database().ref(usersLocationPath);
    // Create a new GeoFire instance at the random Firebase location
    geoFire = new GeoFire(firebaseRef);

    if(typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
      log("Asking user to get their location");
      navigator.geolocation.getCurrentPosition(geolocationCallback, errorHandler);
    } else {
      log("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
    }
  };
  
  /* Callback method from the geolocation API which receives the current user's location */
  var geolocationCallback = function(location) {

    var latitude = location.coords.latitude;
    var longitude = location.coords.longitude;
    log("Retrieved user's location: [" + latitude + ", " + longitude + "]");

    var locationKey = "location";
    geoFire.set(locationKey, [latitude, longitude]).then(function() {
      log("Current user's location has been added to GeoFire");

      // When the user disconnects from Firebase (e.g. closes the app, exits the browser),
      // remove their GeoFire entry
      firebaseRef.child(locationKey).onDisconnect().remove();

      log("Added handler to remove user from GeoFire when you leave this page.");
    }).catch(function(error) {
      log("Error adding user location to GeoFire");
    });
  }

  /* Handles any errors from trying to get the user's current location */
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

  /*************/
  /*  HELPERS  */
  /*************/
  /* Logs to the page instead of the console */
  // function log(message) {
  //   var childDiv = document.createElement("div");
  //   var textNode = document.createTextNode(message);
  //   childDiv.appendChild(textNode);
  //   document.getElementById("log").appendChild(childDiv);
  // }

  function log(message) {
    console.log("HTML5GeoLocation: " + message);
  }
 
  // Define the interface by explicitly reveal public pointers to the 
  // private functions that we want to reveal publicly
  return {
    getLocation: getLocation
  }

})();
