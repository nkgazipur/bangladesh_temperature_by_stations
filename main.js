const bangladeshTopoUrl =
  "https://raw.githubusercontent.com/nkgazipur/Bangladesh_rice_production-2018-2019-/main/bangladesh_topojson_adm2_64_districts_zillas.json";

const tempDataUrl =
  "https://raw.githubusercontent.com/nkgazipur/bangladesh-temperature-by-stations/main/65%20Years%20of%20Weather%20Data%20Bangladesh%20(1948%20-%202013).csv";

const width = window.innerWidth;
const height = window.innerHeight * 0.9;
const margin = { left: 10, right: 10, top: 10, bottom: 10 };

const outerRadius =
  Math.min(
    width - margin.left - margin.right,
    height - margin.top - margin.bottom
  ) / 2;
const innerRadius = outerRadius / 1.5;
const mapMargin = {
  left: width / 2 - innerRadius,
  right: width / 2 - innerRadius,
  top: height / 2 - innerRadius / 1.4,
  bottom: height / 2 - innerRadius / 1.4,
};
const xPadding = 0.2;
const padAngle = 0.01;
const xOffset = 20;
const dotRadius = 5;

const spinnerOptions = {
  lines: 13, // The number of lines to draw
  length: 60, // The length of each line
  width: 17, // The line thickness
  radius: 80, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: "spinner-line-fade-quick", // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: "#ffffff", // CSS color or array of colors
  fadeColor: "transparent", // CSS color or array of colors
  top: "50%", // Top position relative to parent
  left: "50%", // Left position relative to parent
  shadow: "0 0 1px transparent", // Box-shadow for the lines
  zIndex: 2000000000, // The z-index (defaults to 2e9)
  className: "spinner", // The CSS class to assign to the spinner
  position: "absolute", // Element positioning
};

const drawChart = (svg, data) => {
  const zDomain = Object.keys(data[0]).filter(
    (d) => d !== "month" && d !== "station"
  );

  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.month))
    .range([0, Math.PI * 2])
    .paddingInner(xPadding)
    .paddingOuter(xPadding / 2)
    .align(0);

  const xzScale = d3.scaleBand().domain(zDomain).range([0, xScale.bandwidth()]);

  const zScale = d3
    .scaleOrdinal()
    .domain(zDomain)
    .range(d3.schemeSpectral[zDomain.length]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.maxMax)])
    .range([innerRadius, outerRadius]);

  const chartGroup = svg
    .selectAll(".chart-group")
    .data([null])
    .join("g")
    .attr("class", "chart-group")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const arc = (d, t) => {
    return d3
      .arc()
      .innerRadius(yScale(0))
      .outerRadius(yScale(d[t]))
      .startAngle(xScale(d.month) + xzScale(t))
      .endAngle(xScale(d.month) + xzScale(t) + xzScale.bandwidth())
      .padAngle(padAngle)
      .padRadius(innerRadius)();
  };

  const drawArc = (d, i, nodes) => {
    d3.select(nodes[i])
      .selectAll("path")
      .data(zDomain)
      .join("path")
      .attr("d", (t) => arc(d, t))
      .attr("fill", (t) => zScale(t));
  };

  const chartGroupDraw = chartGroup
    .selectAll(".bar-group")
    .data(data)
    .join("g")
    .attr("class", "bar-group")
    .each(drawArc);

  const xAxis = (g) => {
    g.selectAll("g")
      .data(data)
      .join("g")
      .each((d, i) => (d.id = `${d.month}-${i}`))
      .call((g) =>
        g
          .selectAll("path")
          .data((d) => [d])
          .join("path")
          .attr("id", (d) => d.id)
          .datum((d) => [
            d.month,
            d3.timeFormat("%B")(
              d3.timeMonth.offset(d3.timeParse("%B")(d.month), 1)
            ),
          ])
          .attr("fill", "none")
          .attr(
            "d",
            ([a, b]) =>
              `M${d3.pointRadial(xScale(a), innerRadius - xOffset)}A${
                innerRadius - xOffset
              }, ${innerRadius - xOffset} 0,0,1 ${d3.pointRadial(
                xScale(b),
                innerRadius - xOffset
              )}`
          )
      )
      .call((g) =>
        g
          .selectAll("text")
          .data((d) => [d])
          .join("text")
          .selectAll("textPath")
          .data((d) => [d])
          .join("textPath")
          .attr("startOffset", 10)
          .attr("href", (d) => `#${d.id}`)
          .text((d) => d.month)
      );
  };

  chartGroup
    .selectAll(".x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .call(xAxis);

  const yAxis = (g) => {
    g.selectAll("g")
      .data(yScale.ticks().reverse())
      .join("g")
      .call((g) =>
        g
          .selectAll("circle")
          .data((d) => [d])
          .join("circle")
          .attr("fill", "none")
          .attr("stroke", "#000")
          .attr("stroke-opacity", 0.5)
          .attr("r", (d) => yScale(d))
      )
      .call((g) =>
        g
          .selectAll("text")
          .data((d, i) => [{ data: d, index: i }])
          .join("text")
          .attr("y", (d) => -yScale(d.data))
          .attr("dy", "0.35em")
          .attr("stroke", "#fff")
          .attr("stroke-width", 5)
          .attr("text-anchor", "middle")
          .text((d) =>
            d.index === yScale.ticks().length - 1
              ? ""
              : `${d.data}${d.index ? "" : "°C"}`
          )
          .clone(true)
          .attr("y", (d) => yScale(d.data))
          .selectAll(function () {
            return [this, this.previousSibling];
          })
          .clone(true)
          .attr("fill", "#000")
          .attr("stroke", "none")
      );
  };

  chartGroup
    .selectAll(".y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(yAxis);
};

const drawMap = (svg, geoData, stationCor, selectedStation, changeStation) => {
  const projection = d3.geoMercator().fitExtent(
    [
      [mapMargin.left, mapMargin.top],
      [width - mapMargin.right, height - mapMargin.bottom],
    ],
    geoData
  );
  const pathGenerator = d3.geoPath(projection);

  svg
    .selectAll("clipPath")
    .data([null])
    .join("clipPath")
    .attr("id", "circle-clip")
    .selectAll("circle")
    .data([null])
    .join("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", innerRadius - (xOffset + 5));

  const mapGroup = svg
    .selectAll(".map-group")
    .data([null])
    .join("g")
    .attr("class", "map-group")
    .attr("clip-path", "url(#circle-clip)");

  const mapPath = mapGroup
    .selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("fill", "steelblue")
    .attr("stroke", "#000")
    .attr("d", (d) => pathGenerator(d));

  const blink = (d, i, nodes) => {
    if (d.station === selectedStation) {
      d3.select(nodes[i])
        .attr("r", dotRadius)
        .attr("fill", "orange")
        .transition()
        .on("start", function repeat(d) {
          d3.select(this)
            .attr("fill", "red")
            .transition()
            .attr("fill", "green")
            .transition()
            .attr("fill", "yellow")
            .transition()
            .on("start", repeat);
        });
    } else {
      d3.select(nodes[i])
        .transition()
        .attr("r", dotRadius)
        .attr("fill", "orange");
    }
  };

  const stations = mapGroup
    .selectAll("circle")
    .data(stationCor)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("cx", (d) => projection([d.long, d.lat])[0])
          .attr("cy", (d) => projection([d.long, d.lat])[1])
          .each(blink),
      (update) => update.each(blink)
    )
    .attr("pointer-events", "all")
    .attr("cursor", "pointer")
    .on("click", changeStation);
};

const dataParse = (d) => {
  d.date = d3.timeParse("%Y-%m")(`${d["YEAR"]}-${d["Month"]}`);
  d["Max Temp"] = +d["Max Temp"];
  d["Min Temp"] = +d["Min Temp"];
  d.LATITUDE = +d.LATITUDE;
  d.LONGITUDE = +d.LONGITUDE;
  d.Month = +d.Month;
  return d;
};

const procesData = (data, station) => {
  const months = d3.range(1, 13);
  const processedData = [];
  months.forEach((m) => {
    const filteredData = data.filter(
      (d) => d["Station Names"] === station && d.Month === m
    );
    processedData.push({
      station: station,
      month: d3.timeFormat("%B")(filteredData[0].date),
      maxMax: d3.max(filteredData, (d) => d["Max Temp"]),
      avgMax: d3.mean(filteredData, (d) => d["Max Temp"]),
      minMax: d3.min(filteredData, (d) => d["Max Temp"]),
      maxMin: d3.max(filteredData, (d) => d["Min Temp"]),
      avgMin: d3.mean(filteredData, (d) => d["Min Temp"]),
      minMin: d3.min(filteredData, (d) => d["Min Temp"]),
    });
  });
  return processedData;
};

const simplify = (geo, val) => {
  let simplified = topojson.presimplify(geo);
  let min_weight = topojson.quantile(simplified, val);
  //Every arc coordinate whose z-value is lower than min_weight is removed
  return topojson.simplify(simplified, min_weight);
};

const main = async () => {
  const spinnerTarget = document.getElementById("spinner");
  const spinner = new Spinner(spinnerOptions).spin(spinnerTarget);

  const tempData = await d3.csv(tempDataUrl, dataParse);
  const topoData = await d3.json(bangladeshTopoUrl);
  spinner.stop();

  const stationList = Array.from(
    new Set(tempData.map((d) => d["Station Names"])).values()
  );

  const stationCor = stationList.map((d) => ({
    station: d,
    lat: tempData.find((e) => e["Station Names"] === d).LATITUDE,
    long: tempData.find((e) => e["Station Names"] === d).LONGITUDE,
  }));

  const simplifiedTopo = simplify(topoData, 0.05);

  const geoData = topojson.feature(
    simplifiedTopo,
    simplifiedTopo.objects.bangladesh_geojson_adm2_64_districts_zillas
  );

  const svg = d3
    .select("#main-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const changeStation = (e, d) => {
    dropdown.setValue(d.station);
  };

  const dropdown = jSuites.dropdown(document.getElementById("dropdown"), {
    data: stationList,
    value: "Barisal",
    autocomplete: true,
    width: "300px",
    onload: () => {
      drawMap(svg, geoData, stationCor, "Barisal", changeStation);
      drawChart(svg, procesData(tempData, "Barisal"));
    },
    onchange: (d, e) => {
      drawMap(svg, geoData, stationCor, d.value, changeStation);
      drawChart(svg, procesData(tempData, d.value));
    },
  });
};

main();
