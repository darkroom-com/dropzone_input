import UTIF from "utif";

function tiffToPNG(file, callback) {
  const reader = new FileReader();

  reader.onload = function (event) {
    const buffer = event.target.result;

    const imageFileDirs = UTIF.decode(buffer);
    const imageRef = imageFileDirs[0];
    UTIF.decodeImage(buffer, imageRef);
    const rgba  = UTIF.toRGBA8(imageRef);
    const array = new Uint8ClampedArray(rgba);

    const canvas = document.createElement("canvas");
    canvas.width = imageRef.width;
    canvas.height = imageRef.height;

    const ctx = canvas.getContext("2d");
    const imageData = new ImageData(array, imageRef.width, imageRef.height);
    ctx.putImageData(imageData, 0, 0)

    const dataURL = canvas.toDataURL("image/png");

    if (callback != null) {
      callback(dataURL);
    }
  }

  reader.readAsArrayBuffer(file);
}

export { tiffToPNG };
