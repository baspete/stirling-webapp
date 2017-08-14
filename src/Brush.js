import React, { Component } from 'react';
import * as d3 from 'd3';
import dateformat from 'dateformat';
import './App.css';

const margin = {
  top: 10, right: 30, bottom: 10, left: 40
};

const marginStyle = {
  marginTop: margin.top,
  marginRight: margin.right,
  marginBottom: margin.bottom,
  marginLeft: margin.left,
}

const HOURS_12 = 43200000;

class Brush extends Component {
  constructor() {
    super();
    this.handleBrush = this.handleBrush.bind(this);
    this.state = {
      first: 0,
      last: 0,
    };
  }

  handleBrush(x, points) {
    const extent = d3.event.selection.map(x.invert, x);
    console.log(`Brushed extent`, extent);
    d3.select(this.refs.points)
      .selectAll('circle')
      .classed('brush-zone', function(d) {
        return extent[0] <= d[0] && d[0] <= extent[1];
      });
    if (typeof this.props.onBrush === 'function') {
      // Resolve the indexes for the caller
      const first = points.findIndex(xx => xx[0] >= extent[0]);
      const last = points.findIndex(xx => xx[0] >= extent[1]);
      if (first !== this.state.first || last !== this.state.last) {
        setTimeout(() => {
          this.setState({ first, last });
          this.props.onBrush([first, last]);
        }, 0);
      }
    }
  }

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
      const y = d3.scaleLinear().domain([minY, maxY]).range([sHeight, 0]);

      const brush = d3.brushX().extent([[0, 0], [sWidth, sHeight]]).on('start brush', () => this.handleBrush(x, points));

      d3.select(this.refs.points)
        .selectAll('circle')
        .data(points)
        .enter().append('circle')
          .attr('transform', function(d) { return `translate(${x(d[0])},${y(d[1])})`; })
          .attr('r', 1.5);

      d3.select(this.refs.mouse)
          .call(brush)
        .selectAll('.overlay')
          .each(function(d) { d.type = 'selection'; }); // Treat overlay interaction as move.

      // On first load, set the brush to the last 12 hours
      if (this.state.first === 0 && this.state.last === 0) {
        d3.select(this.refs.mouse)
          .call(brush.move, [maxTime-HOURS_12, maxTime].map(x));
      }

      d3.select(this.refs.axis)
          .call(d3.axisBottom(x).tickFormat(x => dateformat(x, 'shortTime')));
    }

    return (
      <div>
        <svg id='brush' transform={`translate(${margin.left},${margin.top})`} width={this.props.width} height={this.props.height} style={marginStyle}>
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
  height: 100,
};

export default Brush;
