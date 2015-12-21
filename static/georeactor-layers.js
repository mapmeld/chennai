var valuesForProperty = {};
var savedIDs = [];
var tamilLabels = {
  'AREA': 'பகுதியில்',
  'PERIMETER': 'சுற்றளவு',
  'SUR_ID': 'ஐடி'
}

function initSidebar() {
  // called when you finish loading first data layer
  $("#loading").hide();
}

function setSelectFeature(feature) {
  // clear data
  $("ul#properties").html("");
  if (!feature) {
    // if user clicks outside mapped area
    $("#save").hide();
    return;
  }

  // show all properties
  currentID = feature.getProperty("SUR_ID");
  feature.forEachProperty(function(value, key) {
    if (['bounds', 'userNote'].indexOf(key) > -1) {
      return;
    }
    var combinedKey = key.toLowerCase();
    if (tamilLabels[key]) {
      combinedKey += " / " + tamilLabels[key];
    }
    var label = $("<label>").text(combinedKey);
    var val = $("<span>").text(value);
    $("<li>")
      .append(label)
      .append(val)
      .appendTo("ul#properties");
  });
  $("<label>").text("Your Notes / குறிப்புகள்").appendTo("ul#properties");
  $("<textarea></textarea>")
    .val(feature.getProperty("userNote"))
    .appendTo("ul#properties");
  $("#save").show();
}

$("#save").click(function (e) {
  // all cases: update user note
  selectFeature.setProperty("userNote", $("#properties textarea").val());
  if (savedIDs.indexOf(currentID) > -1) {
    return;
  }

  // new cases: add to saved list
  var saver = $("<li>").text("SUR ID: " + currentID);
  var myFeature = selectFeature;
  var bounds = myFeature.getProperty("bounds");
  savedIDs.push(currentID);
  saver.on("click", function () {
    fitBounds(bounds);
    selectFeature = myFeature;
    setSelectFeature(myFeature);
    map.data.setStyle(updateVectorMap);
  });
  $("<li>")
    .append(saver)
    .appendTo("ul#saved")

  // update appearance on map
  map.data.setStyle(updateVectorMap);
});
