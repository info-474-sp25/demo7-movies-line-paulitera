// SETUP: Define dimensions and margins for the charts
const margin = { top: 50, right: 30, bottom: 60, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// 1: CREATE SVG CONTAINERS
// 1: Line Chart Container
const svgLine = d3.select("#lineChart")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svgBar = d3.select("#barChart")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("movies.csv").then(data => {
    // 2.a: Reformat Data
    data.forEach(d => {
        d.score = +d.imdb_score;   // Convert score to a number
        d.year = +d.title_year;    // Convert year to a number
        d.director = d.director_name;
        d.gross = +d.gross;
    });

    // Check your work
    console.log(data);

    /* ===================== LINE CHART ===================== */

    // 3: PREPARE LINE CHART DATA (Total Gross by Year)
    // 3.a: Filter out entries with null gross values
    const lineCleanData = data.filter(d => d.gross != null
            && d.year != null
            && d.year >= 2010
    );

    console.log("Line clean data: ", lineCleanData);

    // 3.b: Group by and summarize (aggregate gross by year)
    const lineMap = d3.rollup(lineCleanData,
        v => d3.sum(v, d => d.gross), //total (sum) gross
        d => d.year // group by year
    );

    console.log("Line map data: ", lineMap);

    // 3.c: Convert to array and sort by year
    const lineDataArr = Array.from(lineMap, ([year, gross]) => ({ year, gross }))
        .sort((a, b) => a.year - b.year);

    // Check your work
    console.log("Line data converted to array and sorted: ", lineDataArr);

    // 4: SET SCALES FOR LINE CHART
    // 4.a: X scale (Year)
    const xYearScale = d3.scaleLinear()
        .domain([2010, d3.max(lineDataArr, d => d.year)])
        .range([0, width]);

    // 4.b: Y scale (Gross)
    const yGrossScale = d3.scaleLinear()
        .domain([0, d3.max(lineDataArr, d => d.gross)])
        .range([height, 0]);

    // 4.c: Define line generator for plotting line
    const line = d3.line()
        .x(d => xYearScale(d.year))
        .y(d => yGrossScale(d.gross));

    // 5: PLOT LINE
    svgLine.append("path")
        .datum(lineDataArr) // bind data with datum()
        .attr("d", line)
        .attr("stroke", "purple")
        .attr("stroke-width", 3)
        .attr("fill", "none");

    // 6: ADD AXES FOR LINE CHART
    // 6.a: X-axis (Year)
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xYearScale)
            .tickFormat(d3.format("d")) // remove decimals
            .tickValues(d3.range(
                d3.min(lineDataArr, d => d.year),
                d3.max(lineDataArr, d => d.year) + 1
            ))
        );

    // 6.b: Y-axis (Gross)
    svgLine.append("g")
        .call(d3.axisLeft(yGrossScale)
            .tickFormat(d => d/1000000000 + "B"));

    // 7: ADD LABELS FOR LINE CHART
    // 7.a: Chart Title
    svgLine.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .text("Trends in Total Gross Movie Revenue");

    // 7.b: X-axis label (Year)
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + (margin.bottom / 2) + 10)
        .text("Year");

    // 7.c: Y-axis label (Total Gross)
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 2)
        .attr("x", -height / 2)
        .text("Gross Revenue (Billion $)");

    // 7.c: Y-axis label (Average IMDb Score) (not needed for this viz)

    /* ===================== Bar CHART ===================== */
    // PREP DATA
    // clean data
    const barCleanData = data.filter(d =>
        d.score != null
        && d.director != ''
    )

    console.log("Bar clean data: ", barCleanData)

    // group by director and aggregate the average score
    const barMap = d3.rollup(barCleanData,
        v => d3.mean(v, d => d.score),
        d => d.director
    );

    console.log("Bar map: ", barMap);

    // sort and get top 6
    const barFinalArr = Array.from(barMap,
        ([director, score]) => ({ director, score })
    )
        .sort((a, b) => b.score - a.score) // sort in descending
        .slice(0, 6);

    console.log("Bar final array: ", barFinalArr);

    // SCALE AXIS
    // x-axis
    const xBarScale = d3.scaleBand()
        .domain(barFinalArr.map(d => d.director))
        .range([0, width])
        .padding(0.1);

    // y-axis
    const yBarScale = d3.scaleLinear()
        .domain([0, d3.max(barFinalArr, d => d.score)])
        .range([height, 0]);

    // PLOT DATA
    svgBar.selectAll("rect")
        .data(barFinalArr)
        .enter()
        .append("rect")
        .attr("x", d => xBarScale(d.director))
        .attr("y", d => yBarScale(d.score))
        .attr("width", xBarScale.bandwidth())
        .attr("height", d => height - yBarScale(d.score))
        .attr("fill", "purple");

    // ADD AXIS
    // x-axis
    svgBar.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xBarScale));

    // y -axis
    svgBar.append("g")
        .call(d3.axisLeft(yBarScale));

    // ADD LABELS
    // title
    svgBar.append("text")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .text("Top 6 Average IMDb Scores by Director");

    // x-axis
    svgBar.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + (margin.bottom / 2) + 10)
        .text("Director");

    // y-axis
    svgBar.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 2)
        .attr("x", -height / 2)
        .text("Average Score");
});
