var initMap, map, selectFeature, fitBounds, updateVectorMap, allFeatures, osm, sat, mapJSONfile;

var notesById = {};
if (typeof notes != 'undefined') {
  for (var n = 0; n < notes.length; n++) {
    notesById[notes[n].parcel] = notes[n].note;
  }
}
notes = [];

(function() {
  initMap = function() {

    map = L.map(georeactor.div)
      .setView([georeactor.lat || 0, georeactor.lng || 0], georeactor.zoom || 5);
    new L.Hash(map);

    if (!georeactor.tiles || !georeactor.tiles.length) {
      osm = L.tileLayer('http://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; OpenStreetMap contributors',
        maxZoom: 17
      });
      sat = L.tileLayer('http://{s}.tiles.mapbox.com/v3/mapmeld.map-a6ineq7y/{z}/{x}/{y}.png?updated=65f7243', {
        attribution: 'Map data &copy; OpenStreetMap contributors; satellite from MapBox',
        maxZoom: 17
      }).addTo(map);
      L.control.layers({
        "Satellite": sat,
        "OpenStreetMap": osm
      }, {}).addTo(map);
      map.on('baselayerchange', function() {
        allFeatures.setStyle(updateVectorMap);
      });
    } else {
      for(var t = 0; t < georeactor.tiles.length; t++) {
        L.tileLayer(georeactor.tiles[t], { maxZoom: 17 }).addTo(map);
      }
      initTileView();
      return;
    }

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
      map.fitBounds(L.latLngBounds(
        L.latLng(bounds[1], bounds[0]),
        L.latLng(bounds[3], bounds[2])
      ));
    }

    mapJSONfile = function (responseText) {
      // consume GeoJSON or TopoJSON file
      var gj = null;
      //var datafile = df.toLowerCase();
      if (typeof responseText === 'string') {
        try {
          responseText = JSON.parse(responseText);
          if (responseText.length) {
            for (var i = 0; i < responseText.length; i++) {
              mapJSONfile(responseText[i]);
            }
            return;
          }
        } catch (e) {
          return;
        }
      }
      if (responseText.objects && Object.keys(responseText.objects).length) {
        var tj = responseText;
        var key = Object.keys(tj.objects)[0];
        gj = topojson.feature(tj, tj.objects[key]);
      } else {
        gj = responseText;
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
            allFeatures.setStyle(updateVectorMap);
          });
          $("<li id='layer_" + currentID + "'>")
            .append(saver)
            .appendTo("ul#saved");
        } else {
          gj.features[f].properties.userNote = '';
        }
      }
      fitBounds(globalBounds);

      allFeatures = L.geoJson(gj, {
        style: updateVectorMap,
        onEachFeature: function (feature, layer) {
          layer.on('click', function() {
            fitBounds(feature.properties.bounds);
            selectFeature = feature;
            setSelectFeature(feature);
            allFeatures.setStyle(updateVectorMap);
          });
        }
      }).addTo(map);
      if (typeof setSelectFeature === 'function') {
        map.on('click', function(event) {
          selectFeature = null;
          setSelectFeature(null);
          allFeatures.setStyle(updateVectorMap);
        });
      }
      if (typeof initSidebar === 'function') {
        initSidebar();
      }
    };

    function makeRequestFor(datafile) {
      var df = datafile;
      $.get(datafile, mapJSONfile);
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
      color: '#444',
      weight: 1
    }
    if (typeof savedIDs === 'object' && savedIDs.length && savedIDs.indexOf(feature.properties.SUR_ID) > -1) {
      props.fillColor = '#00f';
      props.fillOpacity = 0.2;
    }
    else if (selectFeature && feature === selectFeature) {
      props.fillOpacity = 0.2;
    }
    if (sat._map) {
      props.color = '#fff';
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

initMap();
