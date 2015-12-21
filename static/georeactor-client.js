var initMap, map, selectFeature, fitBounds, updateVectorMap;

var notesById = {};
for (var n = 0; n < notes.length; n++) {
  notesById[notes[n].parcel] = notes[n].note;
}
notes = [];

(function() {
  initMap = function() {
    map = new google.maps.Map(document.getElementById(georeactor.div), {
      zoom: georeactor.zoom || 5,
      center: georeactor.center || {lat: 0, lng: 0},
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      streetViewControl: false
    });

    map.addListener('maptypeid_changed', function() {
      map.data.setStyle(updateVectorMap);
    });

    var globalBounds = null;
    fitBounds = function(bounds) {
      bounds = bounds.concat([]);
      var size = Math.max(bounds[3] - bounds[1], bounds[2] - bounds[0]);
      if (size < 0.01) {
        var ctrlat = (bounds[3] + bounds[1]) / 2;
        var ctrlng = (bounds[2] + bounds[0]) / 2;
        bounds[0] = bounds[0] - (ctrlng - bounds[0]);
        bounds[1] = bounds[1] - (ctrlat - bounds[1]);
        bounds[2] = bounds[2] + (ctrlng - bounds[0]);
        bounds[3] = bounds[3] + (ctrlat - bounds[1]);
      }
      map.fitBounds(new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds[1], bounds[0]),
        new google.maps.LatLng(bounds[3], bounds[2])
      ));
    }

    function makeRequestFor(datafile) {
      var df = datafile;
      $.get(datafile, function (responseText) {
        // consume GeoJSON or TopoJSON file
        var gj = null;
        var datafile = df.toLowerCase();
        if (datafile.indexOf('topojson') > -1 || datafile.indexOf('topo.json') > -1) {
          var tj = JSON.parse(responseText);
          var key = Object.keys(tj.objects)[0];
          gj = topojson.feature(tj, tj.objects[key]);
        } else if (datafile.indexOf('geojson') > -1 || datafile.indexOf('geo.json') > -1) {
          gj = JSON.parse(responseText);
        } else {
          throw 'data type unknown: ' + datafile;
        }

        // get info on bounds and properties for each data file
        for (var f = 0; f < gj.features.length; f++) {
          var bounds = makeBounds(gj.features[f].geometry.coordinates);
          gj.features[f].properties.bounds = bounds;
          if (!globalBounds) {
            globalBounds = bounds;
          } else {
            globalBounds[0] = Math.min(globalBounds[0], bounds[0]);
            globalBounds[1] = Math.min(globalBounds[1], bounds[1]);
            globalBounds[2] = Math.max(globalBounds[2], bounds[2]);
            globalBounds[3] = Math.max(globalBounds[3], bounds[3]);
          }

          var currentID = gj.features[f].properties.SUR_ID;
          if (notesById[currentID]) {
            gj.features[f].properties.userNote = notesById[currentID];
            var saver = $("<span>").text("SUR ID: " + currentID);
            savedIDs.push(currentID);
            saver.on("click", function () {
              fitBounds(bounds);
              map.data.setStyle(updateVectorMap);
            });
            $("<li id='layer_" + currentID + "'>")
              .append(saver)
              .appendTo("ul#saved");
          } else {
            gj.features[f].properties.userNote = '';
          }
        }
        fitBounds(globalBounds);

        map.data.addGeoJson(gj);
        map.data.setStyle(updateVectorMap);
        map.addListener('click', function(event) {
          selectFeature = null;
          setSelectFeature(null);
          map.data.setStyle(updateVectorMap);
        });
        map.data.addListener('click', function(event) {
          fitBounds(event.feature.getProperty('bounds'));
          selectFeature = event.feature;
          setSelectFeature(event.feature);
          map.data.setStyle(updateVectorMap);
        });
        initSidebar();
      });
    }
    for (var d = 0; d < georeactor.data.length; d++) {
      makeRequestFor(georeactor.data[d]);
    }
  };

  function makeBounds(coordinates, existing) {
    if (!existing) {
      existing = [180, 90, -180, -90];
    }
    if (typeof coordinates[0] === 'number') {
      existing[0] = Math.min(existing[0], coordinates[0]);
      existing[1] = Math.min(existing[1], coordinates[1]);
      existing[2] = Math.max(existing[2], coordinates[0]);
      existing[3] = Math.max(existing[3], coordinates[1]);
    } else {
      for (var c = 0; c < coordinates.length; c++) {
        existing = makeBounds(coordinates[c], existing);
      }
    }
    return existing;
  }

  updateVectorMap = function(feature) {
    var props = {
      fillColor: '#f00',
      fillOpacity: 0,
      strokeColor: '#444',
      strokeWeight: 1
    }
    if (savedIDs && savedIDs.length && savedIDs.indexOf(feature.getProperty('SUR_ID')) > -1) {
      props.fillColor = '#00f';
      props.fillOpacity = 0.2;
    }
    else if (selectFeature && feature === selectFeature) {
      props.fillOpacity = 0.2;
    }
    if (['satellite', 'hybrid'].indexOf(map.getMapTypeId() + '') > -1) {
      props.strokeColor = '#fff';
      if (props.fillOpacity > 0) {
        props.fillOpacity *= 1.5;
      }
    }
    return props;
  }
})();

// forEach and map support for IE<=8 needed for TopoJSON library
if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(fn,scope){
    var i, len;
    for (i = 0, len = this.length; i < len; ++i) {
      if(i in this){
        fn.call(scope, this[i], i, this);
      }
    }
  };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
