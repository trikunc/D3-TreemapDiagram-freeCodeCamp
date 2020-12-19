import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import {
  select,
  hierarchy,
  treemap,
  scaleOrdinal,
  scaleLinear,
  max,
  min,
  mean
} from "d3";

import { schemeTableau10, schemeSet3 } from "d3-scale-chromatic";

import { interpolateRgb } from "d3-interpolate";

export default function App() {
  const dataSet =
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json";
  // "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json";
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gameValues, setGameValues] = useState([]);
  const svgRef = useRef();
  const legendRef = useRef();

  useEffect(() => {
    fetch(dataSet)
      .then((response) => response.json())
      .then((data) => {
        let hierarchyTree = hierarchy(data)
          .sum((d) => {
            return d.value;
          })
          .sort(function (a, b) {
            return b.height - a.height || b.value - a.value;
          });

        treemap().size([1000, 600])(hierarchyTree);

        let cat = hierarchyTree.leaves().map(function (nodes) {
          return nodes.data.category;
        });
        setCategories(
          cat.filter(function (category, index, self) {
            return self.indexOf(category) === index;
          })
        );

        const consoleGameValue = data.children
          .map((data) => data.children)
          .map((gameData) =>
            gameData.map((gameValues) => parseFloat(gameValues.value))
          );
        const gameMean = consoleGameValue.map((value) => mean(value));
        const maxGameMean = max(gameMean);
        setGameValues(maxGameMean);
        setData(hierarchyTree.leaves());
      });
  }, []);

  useEffect(() => {
    console.log(schemeTableau10);

    const minValue = min(data, (d) => parseFloat(d.data.value));

    let color = scaleOrdinal([...schemeTableau10, ...schemeSet3]);

    let opacity = scaleLinear().domain([minValue, gameValues]).range([0.75, 1]);

    const svg = select(svgRef.current).attr("id", "tree-map");
    let tooltip = select("body").append("div").attr("class", "tooltip");

    var block = svg
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "group")
      .attr("transform", (d) => {
        return "translate(" + d.x0 + ", " + d.y0 + ")";
      });

    block
      .append("rect")
      .attr("class", "tile")
      .attr("width", (d) => {
        return d.x1 - d.x0;
      })
      .attr("height", (d) => {
        return d.y1 - d.y0;
      })
      .attr("data-name", function (d) {
        return d.data.name;
      })
      .attr("data-category", function (d) {
        return d.data.category;
      })
      .attr("data-value", function (d) {
        return d.data.value;
      })
      .attr("fill", (d) => {
        return color(d.data.category);
      })
      .attr("opacity", (d) => {
        return opacity(d.data.value);
      })
      .on("mouseover", function (event, d) {
        let coordinates = [event.pageX, event.pageY];
        select(this).classed("active", true);

        tooltip.attr("data-value", d.data.value);

        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .attr("id", "tooltip")
          .attr("data-value", d.data.value)
          .html(
            `
            Name: ${d.data.name}<br>
            Category: ${d.data.category}<br>
            Value: ${d.data.value}
            `
          )
          .style("left", coordinates[0] + 10 + "px")
          .style("top", coordinates[1] - 28 + "px");
      })
      .on("mouseout", function (d) {
        select(this).classed("active", false);
        tooltip.transition().duration(100).style("opacity", 0);
      });

    block
      .append("text")
      .attr("class", "tile-text")
      .selectAll("tspan")
      .data(function (d) {
        return d.data.name.split(/(?=[A-Z][^A-Z])/g);
      })
      .enter()
      .append("tspan")
      .attr("x", 4)
      .attr("y", function (d, i) {
        return 13 + i * 10;
      })
      .text(function (d) {
        return d;
      });

    // Legend //

    const legend = select(legendRef.current).attr("id", "legend");

    var legendWidth = +legend.attr("width");
    const LEGEND_OFFSET = 10;
    const LEGEND_RECT_SIZE = 15;
    const LEGEND_H_SPACING = 50;
    const LEGEND_V_SPACING = 10;
    const LEGEND_TEXT_X_OFFSET = 3;
    const LEGEND_TEXT_Y_OFFSET = -2;
    var legendElemsPerRow = Math.floor(legendWidth / LEGEND_H_SPACING);

    var legendElem = legend
      .append("g")
      .attr("transform", "translate(30," + LEGEND_OFFSET + ")")
      .selectAll("g")
      .data(categories)
      .enter()
      .append("g")
      .attr("transform", function (d, i) {
        return (
          "translate(" +
          (i % legendElemsPerRow) * LEGEND_H_SPACING +
          "," +
          (Math.floor(i / legendElemsPerRow) * LEGEND_RECT_SIZE +
            LEGEND_V_SPACING * Math.floor(i / legendElemsPerRow)) +
          ")"
        );
      });

    legendElem
      .append("rect")
      .attr("width", LEGEND_RECT_SIZE)
      .attr("height", LEGEND_RECT_SIZE)
      .attr("class", "legend-item")
      .attr("fill", function (d) {
        return color(d);
      });

    legendElem
      .append("text")
      .attr("x", LEGEND_RECT_SIZE + LEGEND_TEXT_X_OFFSET)
      .attr("y", LEGEND_RECT_SIZE + LEGEND_TEXT_Y_OFFSET)
      .text(function (d) {
        return d;
      });
  }, [data, categories]);

  return (
    <div className="App">
      <h1 id="title">Video Game Sales</h1>
      <h4 id="description">
        Top 100 Most Sold Video Games Grouped by Platform
      </h4>
      <div className="svgContainer">
        <svg ref={svgRef}></svg>
        <svg ref={legendRef} width={50}></svg>
      </div>
    </div>
  );
}
