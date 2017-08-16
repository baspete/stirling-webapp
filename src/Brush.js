import React, { Component } from 'react';
import * as d3 from 'd3';
import dateformat from 'dateformat';
import Stepper from './Stepper';
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
  constructor(props) {
    super(props);
    this.handleBrush = this.handleBrush.bind(this);
    this.getPoints = this.getPoints.bind(this);
    this.getPrevPoints = this.getPrevPoints.bind(this);
    this.moveBrushTo = this.moveBrushTo.bind(this);

    const { width, height } = props;
    const sWidth = width - margin.left - margin.right;
    const sHeight = height - margin.top - margin.bottom;
    this.brush = d3.brushX().extent([[0, 0], [sWidth, sHeight]]).on('start brush', () => this.handleBrush());

    this.state = {
      first: 0,
      last: 0,
    };
  }

  handleBrush() {
    const points = this.getPoints();
    const sWidth = this.props.width - margin.left - margin.right;

    const minTime = points[0][0];
    const maxTime = points[points.length-1][0];

    // console.log(`X min/max = ${minTime}/${maxTime} Y min/max = ${minY}/${maxY}`);

    const x = d3.scaleLinear().domain([minTime, maxTime]).range([0, sWidth]);

    const extent = d3.event.selection.map(x.invert, x);
    // console.log(`Brushed extent`, extent);
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
        this.setState({ first, last }, () => {
          this.props.onBrush([first, last]);
        });
      }
    }
  }

  moveBrushTo(nx, x) {
    const bw = this.state.last - this.state.first;
    // Resolve back to a timestamp for the x mapping to work
    const points = this.getPoints();
    if (((nx-bw) >= 0) && (nx < points.length)) {
      d3.select(this.refs.mouse).call(this.brush.move, [points[nx-bw][0], points[nx][0]].map(x));
    } else {
      console.log(`Refusing to move brush to ${nx-bw},${nx} with ${points.length} points`);
    }
  }

  getPoints() {
    const { data, xProp } = this.props;

    if (data && data.length > 0 && xProp) {
      return data.map(p => [p.timestamp, p[xProp] || 0]);
    }
    return [];
  }

  getPrevPoints(prevProps) {
    const { data, xProp } = prevProps;

    if (data && data.length > 0 && xProp) {
      return data.map(p => [p.timestamp, p[xProp] || 0]);
    }
    return [];
  }

  componentDidMount() {
    d3.select(this.refs.mouse)
        .call(this.brush)
      .selectAll('.overlay')
        .each(function(d) { d.type = 'selection'; }); // Treat overlay interaction as move.
  }

  componentDidUpdate(prevProps, prevState) {
    // Did we just get data for the first time?
    const points = this.getPoints();
    const prevPoints = this.getPrevPoints(prevProps);
    if (points.length > 0 && prevPoints.length === 0) {
        // Set the brush to it's starting point
        const sWidth = this.props.width - margin.left - margin.right;
        const minTime = points[0][0];
        const maxTime = points[points.length-1][0];

        const x = d3.scaleLinear().domain([minTime, maxTime]).range([0, sWidth]);

        // console.log(`Moving brush to start ${maxTime-HOURS_12}, ${maxTime}`);

        d3.select(this.refs.mouse)
          .call(this.brush.move, [maxTime-HOURS_12, maxTime].map(x));
      }
  }

  render() {
    const { data, width, height } = this.props;
    const sWidth = width - margin.left - margin.right;
    const sHeight = height - margin.top - margin.bottom;

    const points = this.getPoints();

    if (points.length > 0) {
      // console.log(`Brush points length ${points.length}`);

      const minTime = points[0][0];
      const maxTime = points[points.length-1][0];

      const [minY, maxY] = points
        .reduce((a, s) =>
          [Math.min(a[0], s[1]), Math.max(a[1], s[1])],
          [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);

      // console.log(`X min/max = ${minTime}/${maxTime} Y min/max = ${minY}/${maxY}`);

      const x = d3.scaleLinear().domain([minTime, maxTime]).range([0, sWidth]);
      const y = d3.scaleLinear().domain([minY, maxY]).range([sHeight, 0]);

      d3.select(this.refs.points)
        .selectAll('circle')
        .data(points)
        .enter().append('circle')
          .attr('transform', d => `translate(${x(d[0])},${y(d[1])})`)
          .attr('r', 1.5);

      d3.select(this.refs.points)
        .selectAll('circle')
        .data(points)
          .attr('transform', d => `translate(${x(d[0])},${y(d[1])})`);

      d3.select(this.refs.axis)
          .call(d3.axisBottom(x).tickFormat(x => dateformat(x, 'mm/dd htt')));

      return (
        <div>
          <svg id='brush' transform={`translate(${margin.left},${margin.top})`} width={this.props.width} height={this.props.height} style={marginStyle}>
            <g>
              <g ref='points' fillOpacity='0.2' />
              <g ref='mouse' fill='none' pointerEvents='all' />
              <g ref='axis' transform={`translate(0,${sHeight})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle' />
            </g>
          </svg>
          <Stepper current={this.state.last} max={data.length-1} onTick={(nx) => this.moveBrushTo(nx, x)}/>
        </div>
      );
    } else {
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
}

Brush.defaultProps = {
  width: 960,
  height: 100,
};

export default Brush;
