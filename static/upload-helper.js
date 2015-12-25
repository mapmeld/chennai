$("form.box input.file").change(function(e) {
  if (this.files && this.files.length) {
    $("form.box input.btn").attr("disabled", true);
    var file = this.files[0];
    var reader = new FileReader();
    var oneCatch = true;
    reader.onload = function(e) {
      var ext;
      if (reader.readyState !== 2 || reader.error) {
        console.log('reader error - not shapefile');
      }
      else {
        var buffer = e.target.result;
        shp(buffer).then(function(geojson){
          console.log('converted shapefile to GeoJSON');
          // might be an array of GeoJSONs
          try {
            if (geojson.length) {
              for (var i = 0; i < geojson.length; i++) {
                mapJSONfile(geojson[i]);
              }
            } else {
              mapJSONfile(geojson);
            }
          } catch(e) {
            console.log(e);
          }
        }).catch(function() {
          if (oneCatch) {
            oneCatch = false;
            reader.onload = function(e) {
              var text = e.target.result;
              try {
                var jtext = JSON.parse(text);
                console.log('GeoJSON or TopoJSON');
                mapJSONfile(jtext);
              } catch (e) {
                try {
                  var fromkml = toGeoJSON.kml($.parseXML(text));
                  mapJSONfile(fromkml);
                  console.log(kml);
                } catch (e) {
                  console.log('dunno format');
                }
              }
            };
            reader.readAsText(file);
          }
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }
});
