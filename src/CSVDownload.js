import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import CircularProgress from 'material-ui/CircularProgress';
import { default as FileDl } from 'material-ui/svg-icons/file/file-download';
import './App.css';

const style = {
  margin: 12,
};

const floatStyle = {
  display: 'inline',
  position: 'relative',
  top: 480,
  left: 420,
};

class CSVDownload extends Component {
  constructor() {
    super();
    this.download = this.download.bind(this);
    this.state = {
      generating: false,
    };
  }

  download() {
    const { minIdx, maxIdx, data } = this.props;
    this.setState({ generating: true });
    const dataView = maxIdx ? data.slice(minIdx, maxIdx) : data;
    console.log(`Generating CSV Download with ${dataView.length} rows`);
    // Don't include the status column
    const cols = Object.keys(dataView[0]).filter(x => x !== 'status');
    // console.log('Columns:', cols);
    const csvTitles = cols.join(',');
    const csvDataRows = dataView.map(r => cols.map(c => r[c]).join(',')).join('\n');
    const csvData = csvTitles + '\n' + csvDataRows;
    // console.log(csvData);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const objectURL = URL.createObjectURL(blob);
    this.refs.download.href = objectURL;
    this.refs.download.click();
    // Cleanup the objectURL in a bit.
    setTimeout(() => URL.revokeObjectURL(objectURL), 2000);
    this.setState({ generating: false });
  }

  getIcon() {
    if (this.state.generating) {
      return (
        <CircularProgress size={24} thickness={2} />
      );
    }
    return (<FileDl />);
  }

  render() {
    const icon = this.getIcon();
    return (
      <div style={floatStyle}>
        <FlatButton icon={icon} style={style} onTouchTap={this.download} title={'Download data for selected period'} />
        <a ref='download' style={{ display: 'none' }} download='data.csv' />
      </div>
    );
  }
}

CSVDownload.defaultProps = {
  minIdx: 0,
  maxIdx: 0,
};

export default CSVDownload;
