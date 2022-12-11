const sectorGrid = d3.select("#sectorGrid");
const sectorGridWidth = sectorGrid.attr("width");
const sectorGridHeight = sectorGrid.attr("height");
const sectorGridMargin = {top: 70, right: 10, bottom: 10, left: 50};
const sectorChartWidth = sectorGridWidth - sectorGridMargin.left - sectorGridMargin.right;
const sectorChartHeight = sectorGridHeight - sectorGridMargin.top - sectorGridMargin.bottom;
const sectorAxisOffset = 10;

const sectorGridAnnotations = sectorGrid.append("g").attr("id","sectorGridAnnotations")
const sectorBackCol = sectorGrid.append("g").attr("id","sectorBackCol")
                                .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
const sectorChartArea = sectorGrid.append("g").attr("id","sectorChart")
                                .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
                                
sectorChartArea.append("rect").attr("x",-12).attr("y",0)
                .attr("width",sectorChartWidth+12)
                .attr("height",sectorChartHeight+12)
                .attr("fill","#000")
                .attr("opacity",0.03);

const getSectorData = async ()=>{
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
    
        let dPrev = sectorData[i-1]
        let sectorChange = []
        
        for(let[key,value] of Object.entries(d)){
            
            if(key.includes("Total")) continue;
            if(key != "Month"){
                value = (Number(d[key].replace(",",""))-Number(dPrev[key].replace(",","")))
                        /Number(d[key].replace(",",""));
                sectorChange.push({
                    "name" :key, 
                    "change": value.toFixed(4)*100,
                    "value":Number(d[key].replace(",",""))
                });  
            }
        }

        //sort the change rate
        sectorChange.sort(function(a,b){
            return a.change -b.change ;
        })
        
        //find the item closest to zero
        let firstAboveZero= sectorChange.length;
        let found = false;
        sectorChange.forEach((item,index)=>{
            if(!found && item.change>=0){
                firstAboveZero = index;
                found = true;
            }
            
        })
        sectorChange.forEach((d,i)=>{
            sectorChangeData.push({
                "date":date,
                "sector": d.name, 
                "change":d.change, 
                "rank":i-firstAboveZero,
                "value":d.value
            })
        })
    }

    console.log(sectorChangeData)
    const yearExtent = d3.extent(sectorChangeData, d=>d.date)
    const yearScale = d3.scaleTime().domain(yearExtent).range([0,sectorChartWidth]);

    const topYearAxis = d3.axisTop(yearScale)
    const annualBottomGridlines = d3.axisTop(yearScale)
                                    .tickSize(-sectorChartWidth -sectorAxisOffset)
                                    .tickFormat("");
    sectorGridAnnotations.append("g")
                        .attr("class", "year sector-axis")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorAxisOffset},${sectorGridMargin.top})`)
                        .call(topYearAxis)
    sectorGridAnnotations.append("g")
                        .attr("class", "year sector-grid")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorAxisOffset},${sectorGridMargin.top})`)
                        .call(annualBottomGridlines)

    const rankExtent = [-20,20]
    const rankScale = d3.scaleLinear().domain(rankExtent).range([sectorChartHeight,0]);
    const leftChangeAxis = d3.axisLeft(rankScale)
    sectorGridAnnotations.append("g")
                        .attr("class", "rank sector-axis")
                        .attr("transform",`translate(${sectorGridMargin.left-sectorAxisOffset},${sectorGridMargin.top})`)
                        .call(leftChangeAxis)

    let allChange = [];
    sectorChangeData.forEach(d=>{
        allChange.push(d["change"])  
    })
                  
    const sectorColors = ["#5c74eb","#49c2ff","#e3da3d","#ffaf4d","#ff6f56","#df3b82"]
    const sectorColorScale = d3.scaleQuantile()
                                .domain(allChange)
                                .range( sectorColors)
    // draw color legend
    const sectorColorLegend = sectorColorScale.quantiles();
    sectorGridAnnotations.append("text")
                        .text("Change rate of number of jobs")
                        .attr("font-size","15px")
                        .attr("x", 1360)
                        .attr("y",15)
                        .attr("text-anchor", "end")
 
    sectorColors.forEach((d,i)=>{
        sectorGridAnnotations.append("rect")
                            .attr("x", 1400+i*50)
                            .attr("y",0)
                            .attr("width",15)
                            .attr("height",15)
                            .attr("fill",d)
        sectorGridAnnotations.append("text")
                            .attr("font-size","11px")   
                            .text(()=>{
                            if(i==0) return ("< "+sectorColorLegend[0])
                            else if(i==sectorColorLegend.length)
                                return ("> "+sectorColorLegend[sectorColorLegend.length-1])
                            else return (sectorColorLegend[i-1]+"-"+sectorColorLegend[i])
                            })
                            .attr("x",1400+i*50)
                            .attr("y",30)
                            .attr("text-anchor", "middle")
                                            
    })

    const changeSqaureSize = 6;
    const changeSqaureRound = 2;
    //back column
    sectorBackCol.selectAll("rect.changeCol").data(allYear)
                .join("rect")
                .attr('class',"changeCol")
                .attr("fill", "#eaeaea")
                .attr("x", d => yearScale(d))
                .attr("y", 0)
                .attr("width", changeSqaureSize)
                .attr("height", sectorChartHeight)
                .attr("rx",changeSqaureRound)
                .attr("transform",`translate(${-changeSqaureSize*1.5},0)`)
                .attr("opacity",0)
                .on("mouseover", hoverSectorCol)
                .on("mouseout", leaveSectorCol) 

    sectorChartArea.selectAll("rect.changeSquare").data(sectorChangeData)
                .join("rect")
                .attr('class',"changeSquare")
                .attr("fill", d=>d["change"] == 0? "#979797": sectorColorScale(d["change"]))
                .attr("stroke","#000")
                .attr("stroke-width",0)
                .attr("x", d => yearScale(d["date"]))
                .attr("y", d => rankScale(d["rank"]))
                .attr("width", changeSqaureSize)
                .attr("height", changeSqaureSize)
                .attr("rx",changeSqaureRound)
                .attr("transform",`translate(${-changeSqaureSize*1.5},${-changeSqaureSize})`)
                .on("mouseover", hoverSectorSqu)  
                .on("mouseout", leaveSectorSqu)  
    
    let sectorTextLayer = sectorGrid.append("g")
                                    .attr("id", "sectorTextBox")
                                    .attr("transform",`translate(${sectorGridMargin.left},${sectorGridMargin.top})`);
    let sectorTitleBox = sectorTextLayer.append("rect")
                                        .attr("id", "sectorSquareBox")
                                        .attr("height", 18)
                                        .style("fill", "#fff")
                                        .style("opacity", 0);
    let sectorSubBox = sectorTextLayer.append("rect")
                                        .attr("id", "sectorSquareBox")
                                        .attr("height", 60)
                                        .style("fill", "#000")
                                        .style("opacity", 0);

    let label1 = sectorTextLayer.append("text").attr("class", "sectorTitlelabel");
    let label2 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    let label3 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    let label4 = sectorTextLayer.append("text").attr("class", "sectorSublabel");
    sectorTextLayer.selectAll("text.sectorTitlelabel")
                    .style("fill", "#000")
                    .attr("alignment-baseline", "middle");
    sectorTextLayer.selectAll("text.sectorSublabel")
                    .style("fill", "#fff")
                    .attr("alignment-baseline", "middle");

    let boxHeight = 0;
    let boxWidth = 0;

    //set tooptip text
    //first line is sector
    //second line is race
    function setLabelText(d, x, y) {
        const sector = label1.text(d.sector);
        label2.text("Month: " + (d.date.getMonth()+1) +"/"+d.date.getFullYear());
        label3.text("Total jobs: " + d.value);
        label4.text("Changed: " + (d.change).toFixed(2) +"%");

        //set box width based on string length
        let len = sector.text().length  > 20 ? sector.text().length : 20;
        boxWidth = len * 8;d

        //handle edge case so that tooltips for dots close to boundary don't get cropped
        let offsetY = y < 40 ? 40 : 10;
        let offsetX = x > 1500 ? -180 : 10;

        label1.attr("x",5).attr("y", 10);
        label2.attr("x", 5).attr("y", 30);
        label3.attr("x", 5).attr("y", 48);
        label4.attr("x", 5).attr("y", 66);

        sectorTitleBox.attr("x",  0)
                        .attr("y", 0)
                        .attr("width", boxWidth)
                        .style("opacity", 0.8);
        sectorSubBox.attr("x",  0)
                        .attr("y", 18)
                        .attr("width", boxWidth)
                        .style("opacity", 0.8);

        sectorTextLayer.attr("transform",
            `translate(${x+offsetX+sectorGridMargin.left},
            ${y+offsetY+sectorGridMargin.top})`);
    }

    // remove tooltip
    function clearTooptip() {
        sectorTitleBox.style("opacity", 0);
        sectorSubBox.style("opacity", 0);
        label1.text("");
        label2.text("");
        label3.text("");
        label4.text("");
    }

    
    function hoverSectorCol(event,d){
        d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 1)
    }
    function leaveSectorCol(event,d){
        d3.select(this)
            .transition()
            .duration(200)
            .attr("opacity", 0)
    }

    function hoverSectorSqu(event,d){
        points=[]
        d3.selectAll("rect.changeSquare")
            .join("rect")
            .attr("stroke-width",otherSqu=>{
                if(d.sector == otherSqu.sector){
                    points.push(otherSqu)
                    return 2
                }
                else return 0
            })

        let lineGen = d3.line()
                        .x( d => yearScale(d["date"]) )
                        .y( d => rankScale(d["rank"]))
                        .curve(d3.curveLinear);

        sectorChartArea.append("path")
            .attr("class","sectorLine")
            .datum(points)
            .attr("fill", "none")   // using attr here, style would work too
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("d", lineGen)
            .attr("transform",`translate(${-changeSqaureSize},${-changeSqaureSize/2})`);
                        

        const backCol = d3.selectAll("rect.changeCol")
        .join("rect")
        .attr("opacity",d=>
            yearScale(d) == d3.select(this).attr("x") ?
            1:0
        );

        let x = Number(d3.select(this).attr("x"));
        let y = Number(d3.select(this).attr("y"));
        setLabelText(d, x, y)
    }

    function leaveSectorSqu(event,d){
        d3.selectAll(".sectorLine").remove()
        d3.selectAll("rect.changeSquare").attr("stroke-width",0)

        const backCol = d3.selectAll("rect.changeCol")
                        .join("rect")
                        .attr("opacity",0);
        clearTooptip()
    }
}
getSectorData();