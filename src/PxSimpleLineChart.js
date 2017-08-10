import React, { Component } from 'react';
import './App.css';

class PxSimpleLineChart extends Component {
  render() {
    return (
      <div className='PxSimpleLineChart'>
        <link rel='import' href='https://px-host.run.aws-usw02-pr.ice.predix.io/px-simple-line-chart/px-simple-line-chart.html'/>
        <px-simple-line-chart
          id='chart'
          columns={this.props.columns}
          rows={this.props.rows}
          height={this.props.height}
          width={this.props.width}
          line-data={JSON.stringify(this.props.lineData)}
          max-data-points={this.props.maxDataPoints}
          max={this.props.max}
          max-label={this.props.maxLabel}
          min={this.props.min}
          min-label={this.props.minLabel}
          threshold={this.props.lineData.reduce((a, x) => a+x[1], 0)/this.props.lineData.length}
          threshold-label={this.props.thresholdLabel}
          />
      </div>
    );
  }
}

PxSimpleLineChart.defaultProps = {
  columns: 5,
  rows: 0,
  lineData: [],
  height: 300,
  width: 500,
  maxDataPoints: 25,
  maxLabel: 'max',
  minLabel: 'min',
  threshold: Math.random(),
  thresholdLabel: 'avg',
};

export default PxSimpleLineChart;
