import React, { Component } from 'react';
import * as d3 from 'd3';
import dateformat from 'dateformat';
import './App.css';

const margin = {
  top: 194, right: 50, bottom: 214, left: 50
};

class Brush extends Component {
  render() {
    const { data, xProp, width, height } = this.props;
    const sWidth = width - margin.left - margin.right;
    const sHeight = height - margin.top - margin.bottom;

    if (data && data.length > 0) {
      const points = data.map(p => [p.timestamp, p[xProp] || 0]);

      console.log(`Brush points length ${points.length}`);

      const minTime = points[0][0];
      const maxTime = points[points.length-1][0];

      const [minY, maxY] = points
        .reduce((a, s) =>
          [Math.min(a[0], s[1]), Math.max(a[1], s[1])],
          [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);

      console.log(`X min/max = ${minTime}/${maxTime} Y min/max = ${minY}/${maxY}`);

      const x = d3.scaleLinear().domain([minTime, maxTime]).range([0, sWidth]);
      // const y = d3.scaleLinear().domain([minY, maxY]).range([sHeight, 0]);
      const y = d3.scaleLinear().range([sHeight, 0]);

      const brush = d3.brushX().extent([[0, 0], [sWidth, sHeight]]).on('start brush', brushed);

      const dot = d3.select(this.refs.points)
        .selectAll('circle')
        .data(points)
        .enter().append('circle')
          .attr('transform', function(d) { return `translate(${x(d[0])},${y(d[1])})`; })
          .attr('r', 2.5);

      // d3.select(this.refs.mouse)
      //     .call(brush)
      //     .call(brush.move, [3, 5].map(x))
      //   .selectAll('.overlay')
      //     .each(function(d) { d.type = 'selection'; }) // Treat overlay interaction as move.
      //     .on('mousedown touchstart', brushcentered); // Recenter before brushing.

      d3.select(this.refs.axis)
          .call(d3.axisBottom(x).tickFormat(x => dateformat(x, 'shortTime')));

      function brushcentered() {
        var dx = x(1) - x(0), // Use a fixed width when recentering.
            cx = d3.mouse(this)[0],
            x0 = cx - dx / 2,
            x1 = cx + dx / 2;
        d3.select(this.parentNode).call(brush.move, x1 > sWidth ? [sWidth - dx, sWidth] : x0 < 0 ? [0, dx] : [x0, x1]);
      }

      function brushed() {
        var extent = d3.event.selection.map(x.invert, x);
        dot.classed('brush-zone', function(d) { return extent[0] <= d[0] && d[0] <= extent[1]; });
      }
    }

//transform={`translate(${margin.left},${margin.top})`}
    return (
      <div>
        <svg id='brush' width={this.props.width} height={this.props.height} style={margin}>
          <g>
            <g ref='points' fillOpacity='0.2' />
            <g ref='mouse' fill='none' pointerEvents='all' />
            <g ref='axis' transform={`translate(0,${sHeight})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle' />
          </g>
        </svg>
      </div>
    );
  }
}

Brush.defaultProps = {
  width: 960,
  height: 500,
};

export default Brush;
