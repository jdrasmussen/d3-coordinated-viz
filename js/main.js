//script to execute when window is loaded
(function(){
//pseudo-global variables
//variables for data join
var attrArray = [];

var expressed = attrArray[0];

//map frame dimensions
var mapWidth = window.innerWidth * 0.5,
    mapHeight = 700;


window.onload = setMap();

//set up choropleth map
function setMap(){
    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", mapWidth)
        .attr("height", mapHeight);

    //create Albers equal area projection
    var projection = d3.geo.albers()
        .scale(6500)
        .center([6,44.6]) //This isn't working
        .translate([mapWidth/2, mapHeight/2]);

    var path = d3.geo.path()
      .projection(projection);

    // use d3.queue to parallelize async data load
    d3_queue.queue()
        .defer(d3.json, "data/SenateDist02_12to20Results.topojson") //load WI election results
        .defer(d3.json, "data/AssemblyDist02_12to20Results.topojson") //load WI election results
        .defer(d3.json, "data/SenateDist11_12to20Results.topojson") //load WI election results
        .defer(d3.json, "data/AssemblyDist11_12to20Results.topojson") //load WI election results
        .await(callback);

    function callback(error, sd02, ad02, sd11, ad11){

      //get features from topojsons
      var sd02 = topojson.feature(sd02, sd02.objects.SenateDist02_12to20Results).features;
      var ad02 = topojson.feature(ad02, ad02.objects.AssemblyDist02_12to20Results).features;
      var sd11 = topojson.feature(sd11, sd11.objects.SenateDist11_12to20Results).features;
      var ad11 = topojson.feature(ad11, ad11.objects.AssemblyDist11_12to20Results).features;

      //console.log(sd02);

      //create the color scale
      var colorScale = makeColorScale();

      var mapBackground = map.append("rect")
          .attr("class", "mapBackground")
          .attr("width", mapWidth)
          .attr("height", mapHeight);
          //.attr("transform", translate);

       //add US states to map
       var wisconsin = map.selectAll(".wisconsin")
           .data(sd02)
           .enter()
           .append("path")
           .attr("class", function(d){
             return "ass_dist a" + d.properties.SENATE;
           })
           .attr("d", path)
           .style("fill", function(d){
             return choropleth(d.properties, colorScale);
           });

    };
  };// end of setMap function

  function makeColorScale(){
     var colorClasses = [
       "#de2d26", // very strong gop
       "#fcae91", // strong gop
       "#9e9ac8", // middle
       "#bdd7e7", // strong dem
       "#3182bd" // very strong dem
     ];

     //create color scale generator
     var colorScale = d3.scale.threshold()
        .domain([0.3,0.45,0.55,0.7])
        .range(colorClasses);

    return colorScale;
  };//end of makeColorScale

  function choropleth(props, colorScale){
  //make sure attribute value is a number
  // THIS WILL NEED TO BE MADE MORE COMPLEX TO ACCOUNT FOR DIFFERENT ELECTIONS ETC.
  //console.log(props);
  // calculate % democratic vote
  var val = parseFloat(props["PREDEM16"])/parseFloat(props["PRETOT16"]);
  console.log(val);
  console.log(colorScale(val));
  //if attribute value exists, assign a color, otherwise assign gray in case of bad values
  if (typeof val == 'number' && !isNaN(val)){
    return colorScale(val);
  } else {
    return "#CCC";
  };
};

})();
