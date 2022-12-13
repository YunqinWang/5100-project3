const sectorLineChart = d3.select("#sectorLineChart");
    const sectorWidth = sectorLineChart.attr("width");
    const sectorHight = sectorLineChart.attr("height");
    const sectorMargin = {top: 10, right: 10, bottom: 50, left: 50};
    const chartWidth = sectorWidth - sectorMargin.left - sectorMargin.right;
    const chartHeight = sectorHight - sectorMargin.top - sectorMargin.bottom;

    let annotations = sectorLineChart.append("g").attr("id","annotations");
    let chartArea = sectorLineChart.append("g").attr("id","points")
                    .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top})`);


const getData = async () => {
const sectorData = await d3.csv("./sector_employment_data.csv");
    
    let allYear = []
    let sectorChangeData = [];
    for(let i=1; i<sectorData.length; i++){

        let d = sectorData[i];
        let dashPos = d["Month"].indexOf("-");
        let year = Number(d["Month"].slice(0, dashPos))+2000;
        let monthName = d["Month"].slice(dashPos+1);
        let date = new Date(Date.parse(monthName  +" 1, "+year ));

        allYear.push(date)
    

        let sectorChange = []
        
        for(let[key,value] of Object.entries(d)){
            if(key.includes("Total")) continue;
            if(key != "Month"){
                sectorChange.push({
                    "name" :key, 
                    "value":Number(d[key].replace(",",""))
                });  
            }
        }
        sectorChangeData.push({ 
            "date":date,
            "Mining":sectorChange[0],
            "Construction":sectorChange[1],
            "Manufacture":sectorChange[2],
            "wholesale":sectorChange[3],
            "Retail":sectorChange[4],
            "Transportation":sectorChange[5],
            "Utilities":sectorChange[6],
            "Information":sectorChange[7],
            "Finance":sectorChange[8],
            "Business":sectorChange[9],
            "Education":sectorChange[10],
            "Leisure":sectorChange[11],
            "Other":sectorChange[12],
            "Government":sectorChange[13],
        })}
    
function updateAnimated(sectorKey){
    let sectorExtent = d3.extent(sectorChangeData, d=>d[sectorKey]['value']);
    let sectorScale = d3.scaleLinear().domain(sectorExtent).range([chartHeight, 0]);

    //  delete leftAxis and leftGridlines
    let leftAxis = d3.axisLeft(sectorScale)
    let leftGridlines = d3.axisLeft(sectorScale)
                            .tickSize(-chartWidth-10)
                            .tickFormat("")   

    const dateExtent = d3.extent(sectorChangeData, d => d.date);
    const dateScale = d3.scaleTime().domain(dateExtent).range([0, chartWidth]);
    let bottomAxis = d3.axisBottom(dateScale)
    let bottomGridlines = d3.axisBottom(dateScale)
                            .tickSize(-chartHeight-10)
                            .tickFormat("")
    annotations.append("g")
        .attr("class", "x axis")
        .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top+chartHeight})`)
        .call(bottomAxis)
    annotations.append("g")
        .attr("class", "sector-grid")
        .attr("transform",`translate(${sectorMargin.left},${sectorMargin.top+chartHeight})`)
        .call(bottomGridlines);

    let lineGen = d3.line().x(d=>dateScale(d.date)).y(d=>sectorScale(d[sectorKey]['value']));

    chartArea.selectAll("path").remove();
    chartArea.selectAll('circle').remove();
    

    chartArea.append("path")
        .attr("d", lineGen(sectorChangeData))
        .attr("stroke", "#C0EEE4")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    chartArea.selectAll("circle").data(sectorChangeData)
        .join("circle")
        .attr("r",2)
        .attr("fill","#2B3A55")
        .attr("cx",d=>dateScale(d.date))
        .attr("cy",d=>sectorScale(d[sectorKey]['value']))
    


    let mouseGroup = chartArea.append('g')
    let xMarker = mouseGroup.append("line")
        .attr("id","xMarker")
        .attr("fill","none")
        .attr("stroke","purple")
        .attr("stroke-width",1)
        .attr("y1",0)
        .attr("y2",chartHeight)
        .attr("visibility","hidden");

    let valueMarker = mouseGroup.append("circle")
        .attr("id","valueMarker")
        .attr("fill","none")
        .attr("stroke","black")
        .attr("stroke-width",2)
        .attr("r",8)
        .attr("visibility","hidden");

    let label = mouseGroup.append("text")
        .attr("id","label")
        .attr("visibility","hidden");

    let activeRegion = mouseGroup.append("rect")
    .attr("id","activeRegion")
    .attr("width",chartWidth)
    .attr("height",chartHeight)
    .attr("fill","none")
    .attr("pointer-events","all");

activeRegion.on("mouseover", function() {
    xMarker.attr("visibility","");
    valueMarker.attr("visibility","");
    label.attr("visibility",""); 
});

  // When the mouse leaves, hide the annotations
activeRegion.on("mouseout", function() {
    xMarker.attr("visibility","hidden");
    valueMarker.attr("visibility","hidden");
    label.attr("visibility","hidden"); 
});

let findDate = d3.bisector(d=>d.date).right;
activeRegion.on("mousemove", function(evt) {
    let location = d3.pointer(evt);
    let x = location[0];
    let xDate = dateScale.invert(x);
    let index = findDate(sectorChangeData, xDate);
    let d = sectorChangeData[index];

    let xPos = dateScale(d.date);
    let yPos = sectorScale(d[sectorKey]['value']);

    xMarker.attr("x1",xPos).attr("x2",xPos);
    valueMarker.attr("cx",xPos).attr("cy",yPos);

    let txt = `${d[sectorKey]['name'] + ": " + d[sectorKey]['value']+ ";  " + (d.date.getMonth() + 1) + "/" + d.date.getFullYear()}`;
    label.text(txt)

    if (xPos > chartWidth/2) {
        label.attr("text-anchor","end")
            .attr("x",xPos-10)
            .attr("y",yPos-10);
    }else{
        label.attr("text-anchor","start")
            .attr("x",xPos+10)
            .attr("y",yPos-10);
    }

} 
);   
}


// get key text for buttons
const allKeys = Object.keys(sectorChangeData[0]).filter(d=>d!="date");
allKeys.forEach(d=>{
    d3.select("div#button-bar")
    .append("button")
    .text(d)
    .attr("class","button-bar")
    .on('click', function(){
        updateAnimated(d);
    })
});
}

getData();

