//basic linePLot setting

const lineSvg = d3.select("svg#lineplot");
const lineWidth = lineSvg.attr("width");
const lineHeight = lineSvg.attr("height");
const lineMargin = { top: 50, right: 10, bottom: 50, left: 50 };
const linePlotWidth = lineWidth - lineMargin.left - lineMargin.right;
const linePlotHeight = lineHeight - lineMargin.top - lineMargin.bottom;

const lineAnnotations = lineSvg.append("g").attr("id", "line-annotations");
const lineChartArea = lineSvg
  .append("g")
  .attr("id", "chart")
  .attr("transform", `translate(${lineMargin.left},${lineMargin.top})`);

const loadLinePlotData = async function () {
  const linePlotData = await d3.csv("unemployedRate.csv", d3.autoType);
  //   console.log(linePlotData);

  const sliceLine = linePlotData.slice(51, 71);

  const timeParser = d3.timeParse("%Y");
  sliceLine.forEach((d) => {
    d["year"] = timeParser(d["year"]);
  });
  console.log(sliceLine);

  let newData = [];
  newData["Overall"] = sliceLine.map((item) => ({
    year: item.year,
    rate: item.Overall,
  }));
  newData["Men"] = sliceLine.map((item) => ({
    year: item.year,
    rate: item.Men,
  }));
  newData["Women"] = sliceLine.map((item) => ({
    year: item.year,
    rate: item.Women,
  }));
  newData["Clear"] = newData.Overall;

  console.log(newData);

  //x axis
  //!!!!2021 didn't show
  const lineYearExtent = d3.extent(sliceLine, (sliceLine) => sliceLine.year);
  console.log(lineYearExtent);

  const lineYearScale = d3
    .scaleTime()
    .domain(lineYearExtent)
    .range([0, linePlotWidth - 20]);
  let lineBottomAxis = d3.axisBottom(lineYearScale);

  lineAnnotations
    .append("g")
    .attr("class", "x axis")
    .attr(
      "transform",
      `translate(${lineMargin.left},${linePlotHeight + lineMargin.top + 10} )`
    )
    .call(lineBottomAxis);

  //y axis
  const allPercentageExtent = d3.extent(
    sliceLine,
    (sliceLine) => sliceLine.Overall
  );
  console.log(allPercentageExtent);
  const percentageScale = d3
    .scaleLinear()
    .domain([3, 12])
    .range([linePlotHeight, 0]);

  let lineLeftAxis = d3.axisLeft(percentageScale);
  lineAnnotations
    .append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${lineMargin.left - 10},${lineMargin.top})`)
    .call(lineLeftAxis);

  //draw the line

  //get key text
  const buttonText = Object.keys(newData);
  console.log(buttonText);
  const index = buttonText.indexOf("Overall");
  buttonText.splice(index, 1);

  buttonText.forEach((d) => {
    d3.select("div#line-button-bar")
      .append("button")
      .attr("class", "line-button")
      .style("margin", "10px")
      .text(d)
      .on("click", function () {
        console.log(d);
        updateLine(d);
      });
  });

  //button style
  let allButton = d3.selectAll(".line-button"); // select all elements with class "line-button"
  const nodes = allButton.nodes();
  allButton
    .style("background", "none")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "3x 10px 5px 10px"); // apply styles to elements

  allButton.on("mouseover", function (d, i) {
    d3.select(this).style("background", "black");
    d3.select(this).style("color", "white");
  });
  allButton.on("mouseout", function () {
    d3.select(this).style("background", "none");
    d3.select(this).style("color", "black");
  });

  //Active Ovrerall
  const active = newData.Overall;
  console.log(active);
  let lineGen = d3
    .line()
    .x((active) => lineYearScale(active["year"]))
    .y((active) => percentageScale(active["rate"]));

  lineChartArea
    .append("path")
    .datum(active)
    .attr("class", "overall")
    .attr("fill", "none") // using attr here, style would work too
    .attr("stroke", "darkgrey")
    .attr("stroke-width", 2)
    // .attr("transform", `translate(${0},${0} )`)
    .attr("d", lineGen);

  lineChartArea
    .append("g")
    .attr("class", "greycircle")
    .selectAll("circle")
    .data(active)
    .join("circle")
    .attr("r", 3)
    .attr("fill", "darkgrey") // using attr here, style would work too
    .attr("cx", (active) => lineYearScale(active.year))
    .attr("cy", (active) => percentageScale(active.rate));

  //color
  var myColor = d3
    .scaleOrdinal()
    .domain(["Men", "Women", "Clear"])
    .range(["lightblue", "pink", "lightgrey"]);

  function updateLine(key) {
    console.log(key);
    const lineData = newData[key];
    console.log(lineData);
    //call the marker function
    marker(lineData);

    lineChartArea.selectAll(".gender").remove();
    lineChartArea.selectAll(".colorcircle").remove();

    lineChartArea
      .append("path")
      .datum(lineData)
      .attr("class", "gender")
      .attr("fill", "none")
      .attr("stroke", myColor(key))
      .attr("stroke-width", 2)
      // .attr("transform", `translate(${0},${0} )`)
      .attr(
        "d",
        d3
          .line()
          .x((d) => lineYearScale(d["year"]))
          .y((d) => percentageScale(d["rate"]))
      );
    lineChartArea
      .append("g")
      .attr("class", "colorcircle")
      .selectAll("circle")
      .data(lineData)
      .join("circle")
      .attr("r", 3)
      .attr("fill", myColor(key)) // using attr here, style would work too
      .attr("cx", (d) => lineYearScale(d.year))
      .attr("cy", (d) => percentageScale(d.rate));
  }

  //legend:
  const yValue = "percentage";
  const keys = ["Overall", "Men", "Women"];

  var legendColor = d3
    .scaleOrdinal()
    .domain(keys)
    .range(["lightgrey", "lightblue", "pink"]);

  lineSvg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", "10px")
    .attr("style", "font-size:12px")
    .attr(
      "transform",
      `translate(${lineMargin.left + 20},${lineMargin.top - 30})`
    )
    .text(yValue);

  var lineLegend = lineSvg
    .selectAll(".lineLegend")
    .data(keys)
    .enter()
    .append("g")
    .attr("class", "lineLegend")
    .attr("transform", function (d, i) {
      return `translate(${linePlotWidth - 30},${i * 20 + 10})`;
    });

  lineLegend
    .append("text")
    .text(function (d) {
      return d;
    })
    .attr("transform", "translate(15, 6)"); //align texts with boxes

  lineLegend
    .append("rect")
    .attr("fill", (d) => legendColor(d))
    .attr("width", 12)
    .attr("height", 5);

  //marker lines
  const marker = function (value) {
    let mouseGroup = lineChartArea.append("g");
    let xMarker = mouseGroup
      .append("line")
      .attr("id", "xMarker")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", linePlotHeight)
      .attr("visibility", "hidden");

    let valueMarker = mouseGroup
      .append("circle")
      .attr("id", "valueMarker")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("fill", "black")
      .attr("stroke-width", 2)
      .attr("r", 6)
      .attr("opacity", 0.5)
      .attr("visibility", "hidden");

    let label = mouseGroup
      .append("text")
      .attr("id", "label")
      .attr("visibility", "hidden");

    let activeRegion = mouseGroup
      .append("rect")
      .attr("id", "activeRegion")
      .attr("width", linePlotWidth)
      .attr("height", linePlotHeight)
      .attr("fill", "none")
      .attr("pointer-events", "all");

    activeRegion.on("mouseover", function () {
      xMarker.attr("visibility", "");
      valueMarker.attr("visibility", "");
      label.attr("visibility", "");
    });

    activeRegion.on("mouseout", function () {
      xMarker.attr("visibility", "hidden");
      valueMarker.attr("visibility", "hidden");
      label.attr("visibility", "hidden");
    });

    let findDate = d3.bisector((value) => value["year"]).right;

    activeRegion.on("mousemove", function (evt) {
      // Update the position as you move

      // Get mouse location
      let location = d3.pointer(evt);

      let x = location[0];

      let xDate = lineYearScale.invert(x);

      let index = findDate(value, xDate);

      let d = value[index];

      let xPos = lineYearScale(value[index].year);
      let yPos = percentageScale(value[index].rate);

      xMarker.attr("x1", xPos).attr("x2", xPos);
      valueMarker.attr("cx", xPos).attr("cy", yPos);

      let txt =
        `${value[index].year.getFullYear()}` +
        ` ` +
        `${value[index].rate + "%"}`;

      // We started with the following line, which has lots of overlaps
      // label.attr("x",xPos).attr("y",yPos).text(txt);

      // Here's a simple way to remove overlaps and deliver a consistent user experience
      label.text(txt);
      if (xPos < linePlotWidth / 2.0) {
        label
          .attr("x", xPos + 4)
          .attr("y", 100)
          .attr("text-anchor", "start");
      } else {
        label
          .attr("x", xPos - 4)
          .attr("y", linePlotHeight - 100)
          .attr("text-anchor", "end");
      }
    });
  };
  marker(active);
};
loadLinePlotData();
