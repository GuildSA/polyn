
var Utility = (function() {
  "use strict";

  var _errorToast;

  var showErrorToast = function(text) {

    if(!_errorToast) {

      var polynApp = document.getElementById("polynApp");

      if(polynApp) {

        _errorToast = polynApp.$.errorToast;

        if(!_errorToast) {
          log("Failed to get 'errorToast'!")
          return;
        }

      } else {
        log("Failed to get 'polynApp'!")
        return;
      }
    }

    _errorToast.text = text;
    _errorToast.open();
  };

  function log(message) {
    console.log("Utility: " + message);
  }

  // Define the public interface by explicitly revealing public pointers to the 
  // our private functions.
  return {
    showErrorToast: showErrorToast,
  }

})();
