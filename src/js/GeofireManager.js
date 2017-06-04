
// https://github.com/firebase/geofire-js/blob/master/examples/html5Geolocation/index.html
// https://medium.freecodecamp.com/javascript-modules-a-beginner-s-guide-783f7d7a5fcc

var GeofireManager = (function() {
  "use strict";

  var _firebaseRef;
  var _geoFire;
  var _usersLocationCallback;
  var _usersLocationError;
  var _sellerFoundCallback;

  // Uses the HTML5 geolocation API to get the current user's location.
  var getUsersLocation = function(usersInfoKeyPath, usersLocationCallback, usersLocationError) {

    _usersLocationCallback = usersLocationCallback;
    _usersLocationError = usersLocationError;

    _firebaseRef = firebase.app("polyn-app").database().ref(usersInfoKeyPath);

    // Create a new GeoFire instance pointing at the user's data.
    _geoFire = new GeoFire(_firebaseRef);

    if(typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
      log("Asking user to get their location");

      var positionOptions = { 
        enableHighAccuracy: false,
        timeout: 5000
      };

      navigator.geolocation.getCurrentPosition(geolocationCallback, errorHandler, positionOptions);
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

      if(_usersLocationCallback) {
        _usersLocationCallback(location);
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

    if(_usersLocationError) {
       _usersLocationError(error);
    }
  };
  
  var addSellerToLocations = function(sellersCategory, sellersKey, latitude, longitude) {

    console.log("  sellersCategory: " + sellersCategory);
    console.log("  sellersKey: " + sellersKey);
    console.log("  latitude: " + latitude);
    console.log("  longitude: " + longitude);

// "collectables/sub/vinylRecords"

    var sellersByLocationRef = firebase.app("polyn-app").database().ref("locations/" + sellersCategory);

    // Create a new GeoFire instance pointing at the user's data.
    var geoFireSellersRef = new GeoFire(sellersByLocationRef);

    geoFireSellersRef.set(sellersKey, [latitude, longitude]).then(function() {
      log("Seller location has been added to seller's key");
    }).catch(function(error) {
      log("Error adding seller's location: " + error);
    });
  }

  //--------------------------------------------------------------------------
  // The method getDistance calculates the distance between two points 
  // (given the latitude/longitude of those points).
  //
  // Definitions:
  //   South latitudes are negative, east longitudes are positive
  //
  // Passed to function:
  //  lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)
  //  lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)
  //  unit = the unit you desire for results
  //    where: 'M' is statute miles (default)
  //           'K' is kilometers
  //           'N' is nautical miles
  //--------------------------------------------------------------------------
  var getDistance = function(lat1, lon1, lat2, lon2, unit) {

    var radlat1 = Math.PI * lat1/180
    var radlat2 = Math.PI * lat2/180
    var theta = lon1-lon2
    var radtheta = Math.PI * theta/180
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist)
    dist = dist * 180/Math.PI
    dist = dist * 60 * 1.1515
    if(unit=="K") { dist = dist * 1.609344 }
    if(unit=="N") { dist = dist * 0.8684 }
    return dist
  }

  var getSellersByLocation = function(sellersCategory, latitude, longitude, range, sellerFoundCallback) {

    console.log("  sellersCategory: " + sellersCategory);
    console.log("  latitude: " + latitude);
    console.log("  longitude: " + longitude);
    console.log("  range: " + range);

    _sellerFoundCallback = sellerFoundCallback;

    var sellersByLocationRef = firebase.app("polyn-app").database().ref("locations/" + sellersCategory + "/");
    var geoFireSellersRef = new GeoFire(sellersByLocationRef);

    var geoQuery = geoFireSellersRef.query({
        center: [latitude, longitude],
        radius: range // Kilometers
      });

    var onKeyEnteredRegistration = geoQuery.on("key_entered", function(key, location) {

      log(key + " entered the query.");
      log("location: " + JSON.stringify(location, null, 4));

      if(_sellerFoundCallback) {

        const distance = getDistance(latitude, longitude, location[0], location[1], "M");

        _sellerFoundCallback(key, distance);
      }
    });

    var onReadyRegistration = geoQuery.on("ready", function() {

      log("  The 'ready' event fired - cancelling query.");

      geoQuery.cancel();
    })
  }

  function log(message) {
    console.log("GeofireManager: " + message);
  }

  // Define the public interface by explicitly revealing public pointers to the 
  // our private functions.
  return {
    getUsersLocation: getUsersLocation,
    addSellerToLocations: addSellerToLocations,
    getSellersByLocation: getSellersByLocation
  }

})();
