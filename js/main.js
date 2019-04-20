//script to execute when window is loaded
(function(){
//pseudo-global variables
//variables for data join
var attrArray = [];

var expressed = attrArray[0];

//map frame dimensions
var mapWidth = window.innerWidth * 0.6,
    mapHeight = 475;


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
        //.center([43.784,88.788]) This isn't working
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

      console.log(sd02);

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
             console.log(d.properties.SENATE);
           })
           .attr("d", path);

    };
  };// end of setMap function



})();
