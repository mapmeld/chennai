$(function() {
  var downloaded_layers = {};

  $('input[type="checkbox"]').change(function(e) {
    var layer_id = $(e.currentTarget).attr('name');
    var activate = $(e.currentTarget).prop('checked');
    if (downloaded_layers[layer_id]) {
      if (activate) {
        downloaded_layers[layer_id].addTo(map);
      } else {
        map.removeLayer(downloaded_layers[layer_id]);
      }
    } else if (activate) {
      $.get(layer_id, function(data) {
        try {
          data = JSON.parse(data)
        } catch(e) {
        }
        downloaded_layers[layer_id] = mapJSONfile(data);
      });
    }
  });
});
