var canv = document.getElementById("map");
canv.width = 862;
canv.height = 898;
var ctx = canv.getContext('2d');
var img = new Image();
img.onload = function() {
  ctx.drawImage(img, 0, 0, 862, 898);
  var original = ctx.getImageData(0, 0, 862, 898);
  setInterval(function() {
    var lead = 16;
    var trail = 0;
    var current = original.data;
    var swipe = setInterval(function() {
      for (var x = trail; x < lead; x++) {
        for (var y = 0; y < 898; y++) {
          var pixelStart = (y * 862 + x) * 4;
          current[pixelStart] = 255 - current[pixelStart];
          current[pixelStart+1] = 255 - current[pixelStart+1];
          current[pixelStart+2] = 255 - current[pixelStart+2];
        }
      }
      original.data.set(current);
      ctx.putImageData(original, 0, 0);
      lead += 16;
      trail += 16;
      if (trail > 850) {
        clearInterval(swipe);
      }
    }, 150);

  }, 13000);
};
img.src = "/chennai-metro.jpg";
