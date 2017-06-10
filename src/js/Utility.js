
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

  //----------------------------------------------------------------------------
  // The getOrientation method parses the EXIF (exchangeable image file format)
  // image data in a JPEG image and returns an int value representing the 
  // orientation of the image.
  //
  // The EXIF specification defines an Orientation Tag number to indicate the 
  // orientation of the camera relative to the captured scene. This can be used 
  // by the camera either to indicate the orientation automatically by an 
  // orientation sensor, or to allow the user to indicate the orientation 
  // manually by a menu switch, without actually transforming the image data itself.
  //
  // Here is what the letter F would look like if it were tagged correctly and displayed 
  // by a program that ignores the orientation tag (thus showing the stored image):
  //
  //   1        2        3   4            5          6           7          8
  //
  // 888888  888888      88  88      8888888888  88                  88  8888888888
  // 88          88      88  88      88  88      88  88          88  88      88  88
  // 8888      8888    8888  8888    88          8888888888  8888888888          88
  // 88          88      88  88
  // 88          88  888888  888888
  //
  // The method may also return the special values -1 or -2:
  // -1: orientation was not defined.
  // -2: file or blob passed was not a jpeg.
  //
  // http://www.daveperrett.com/articles/2012/07/28/exif-orientation-handling-is-a-ghetto/
  // https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side
  //----------------------------------------------------------------------------

  var getOrientation = function(file, callback) {

    var reader = new FileReader();
    reader.onload = function(e) {

      var view = new DataView(e.target.result);
      if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
      var length = view.byteLength, offset = 2;
      while (offset < length) {
        var marker = view.getUint16(offset, false);
        offset += 2;
        if (marker == 0xFFE1) {
          if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
          var little = view.getUint16(offset += 6, false) == 0x4949;
          offset += view.getUint32(offset + 4, little);
          var tags = view.getUint16(offset, little);
          offset += 2;
          for (var i = 0; i < tags; i++)
            if (view.getUint16(offset + (i * 12), little) == 0x0112)
              return callback(view.getUint16(offset + (i * 12) + 8, little));
        }
        else if ((marker & 0xFF00) != 0xFF00) break;
        else offset += view.getUint16(offset, false);
      }
      return callback(-1);
    };
    reader.readAsArrayBuffer(file);
  }

  var getBase64 = function(file, callback) {
    var reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = function () {
      callback(reader.result);
    };

    reader.onerror = function (error) {
      callback('Error: ', error);
    };
  }

  //----------------------------------------------------------------------------
  // Given the known EXIF orientation of a JPEG image, the resetOrientation 
  // method resets the JPEG image to orientation 1 which will causes the image
  // to be viewed correclty in browsers that ignore the EXIF orientation tag.
  //
  // https://stackoverflow.com/questions/20600800/js-client-side-exif-orientation-rotate-and-mirror-jpeg-images
  //----------------------------------------------------------------------------
  var resetOrientation = function(srcBase64, srcOrientation, callback) {
    var img = new Image();    

    img.onload = function() {
      var width = img.width,
          height = img.height,
          canvas = document.createElement('canvas'),
          ctx = canvas.getContext("2d");

      // set proper canvas dimensions before transform & export
      if ([5,6,7,8].indexOf(srcOrientation) > -1) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      // transform context before drawing image
      switch (srcOrientation) {
        case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
        case 7: ctx.transform(0, -1, -1, 0, height , width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        default: ctx.transform(1, 0, 0, 1, 0, 0);
      }

      // draw image
      ctx.drawImage(img, 0, 0);

      // export base64
      callback(canvas.toDataURL());
    };

    img.src = srcBase64;
  };

  // https://stackoverflow.com/questions/23150333/html5-javascript-dataurl-to-blob-blob-to-dataurl
  var dataURLtoBlob = function(dataurl) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
  }

  //----------------------------------------------------------------------------
  // If required, the correctOrientation resets the EXIF orientation to 1 so the
  // image can be dispalyed correctly in browesers that do not adjust the image
  // for EXIF orientation.
  //----------------------------------------------------------------------------
  var correctOrientation = function(file, callback) {

    getOrientation(file, function(orientation) {

      log("Called to getOrientation returned: " + orientation);

      if(orientation > 1) {

        log("Calling getBase64.");

        getBase64(file, function(base64, error) {

          if(!error) {

            log("Calling resetOrientation.");

            resetOrientation(base64, orientation, function(resetBase64Image) {

              log("Call to resetOrientation done!");

              const blob = dataURLtoBlob(resetBase64Image);
              callback(blob);
            });

          } else {
            log("Call to getBase64 failed!");
// TODO: Handle Error!
            callback(file);
          }
        });

      } else {

        log("No call to resetOrientation needed - just return the file.");
        callback(file);
      }
    });
  }

  function log(message) {
    console.log("Utility: " + message);
  }

  // Define the public interface by explicitly revealing public pointers to the 
  // our private functions.
  return {
    showErrorToast: showErrorToast,
    getOrientation: getOrientation,
    resetOrientation: resetOrientation,
    getBase64: getBase64,
    dataURLtoBlob: dataURLtoBlob,
    correctOrientation: correctOrientation
  }

})();
