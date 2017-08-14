import React, { Component } from 'react';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { extent } from 'd3-array';
import { contourDensity } from 'd3-contour';
import { geoPath } from 'd3-geo';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { interpolateYlGnBu } from 'd3-scale-chromatic';
import Brush from './Brush';
import './App.css';

const margin = {
  top: 20, right: 30, bottom: 30, left: 40
};

class ContourChart extends Component {
  constructor() {
    super();
    this.getData = this.getData.bind(this);
    this.state = {
      anim: true,
      latest: 0,
    };
  }

  getData() {

    const { xProp, yProp, data, offset, count } = this.props;

    console.log(`Plotting ${xProp} vs ${yProp}`);

    if (data && xProp && yProp && data.length > 0) {

      const dataView = data.slice(offset, offset+count);
      console.log(`Viewing ${dataView.length} points from ${offset}`);

      const x = scaleLinear().rangeRound([margin.left, this.props.width - margin.right]);
      const y = scaleLinear().rangeRound([this.props.height - margin.bottom, margin.top]);
      const colors = scaleSequential(interpolateYlGnBu).domain([0, this.props.contours]);

      x.domain(extent(dataView, d => d[xProp])).nice();
      y.domain(extent(dataView, d => d[yProp])).nice();

      const cdataView = contourDensity()
          .x(d => x(d[xProp]))
          .y(d => y(d[yProp]))
          .size([this.props.width, this.props.height])
          .bandwidth(this.props.contours)(dataView);

      const contours = cdataView.map(c => geoPath()(c));
      const points = dataView.map(p => ({ x: x(p[xProp] || 0), y: y(p[yProp] || 0) }));
      const latest = dataView.reduce((m, x) => Math.max(m, x.timestamp), this.state.latest);

      if (latest > this.state.latest) {
        setTimeout(() => {
          this.setState({ latest, anim: true });
        }, 0);
      }

      console.log('xAxis = ', this.refs.xAxis);

      // Attach the axes
      select(this.refs.xAxis).call(axisBottom(x));
      select(this.refs.xAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('y', -3)
        .attr('dy', null)
        .attr('font-weight', 'bold')
        .text(this.props.xProp);

      select(this.refs.yAxis).call(axisLeft(y));
      select(this.refs.yAxis)
        .select('.tick:last-of-type text')
        .select(function() { return this.parentNode.appendChild(this.cloneNode()); })
        .attr('x', 3)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text(this.props.yProp);

      return { points, contours, colors };
    }
    return { points: [], contours: [], colors: [] };
  }

  render() {
    const { points, contours, colors } = this.getData();
    const OP_MIN = 0.3;
    const OP_MAX = 1.0;
    const opac = i => ((i / points.length) * (OP_MAX-OP_MIN)) + OP_MIN;
    const newest = i => i === points.length - 1;

    // Use the timestamp of the latest point as a trigger to add the class.
    // Hack to remove the new-point animation class after a while
    if (this.state.anim) {
      setTimeout(() => {
        this.setState({ anim: false });
      }, 5000);
    }

    return (
      <div>
        <svg id='chart' width={this.props.width} height={this.props.height} style={margin}>
          <g fill='none' stroke='steelblue' strokeLinejoin='round' strokeWidth='0.5'>
            { contours.map((c, i) => <path key={i} d={c} fill={colors(i)}></path>) }
          </g>
          <g stroke='white'>
          { points.map((p, i) =>
            <circle className={newest(i) && this.state.anim ? 'new-point' : ''} key={i} cx={p.x} cy={p.y} r='2' fill={newest(i) ? 'red' : 'black'} fillOpacity={opac(i)}></circle>
          )}
          </g>
          <g ref='xAxis' transform={`translate(0,${this.props.height - margin.bottom})`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='middle'></g>
          <g ref='yAxis' transform={`translate(${margin.left},0)`} fill='none' fontSize='10' fontFamily='sans-serif' textAnchor='end'></g>
        </svg>
        <Brush width={this.props.width} data={this.props.data} xProp={this.props.xProp}/>
      </div>
    );
  }
}

ContourChart.defaultProps = {
  width: 960,
  height: 500,
  contours: 15,
  offset: 0,
  count: 1000,
};

export default ContourChart;
