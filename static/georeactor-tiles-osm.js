function initTileView() {
  $("#loading").hide();
  var warning = $("<p>Are these roads missing? Zoom in to check, then click Edit OSM.</p>");
  $("#sidebar").append(warning);

  var editButton = $("<button class='btn'>Zoom In</button>").click(function() {
    var center = map.getCenter();
    var zoom = map.getZoom();
    if (zoom < 16) {
      return map.zoomIn();
    }
    window.location.href = "http://www.openstreetmap.org/edit?editor=id#map=" + [Math.round(zoom), center.lat, center.lng].join("/") + "&background=custom:https://b.tiles.mapbox.com/v4/planemad.ba506c30/{z}/{x}/{y}.png%3Faccess_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ";
  });
  map.on('zoomstart', function() {
    editButton.text("...");
  }).on('zoomend', function() {
    if (map.getZoom() >= 16) {
      editButton.text("Edit OSM");
    } else {
      editButton.text("Zoom In");
    }
  });

  $("#sidebar").append(editButton);
}
