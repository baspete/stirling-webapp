import React, { Component } from 'react';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import Refresh from 'material-ui/svg-icons/navigation/refresh';
import ReloadButton from './ReloadButton';
import { myPost } from './myFetch';
import './App.css';

const RESOLVE_URL = 'https://skills-service.run.aws-usw02-pr.ice.predix.io/skills/resolve-asset-from-device/run';

const TABLE_ROW_STYLE = {
  fontSize: 10,
  height: 22,
};

class DeviceInfo extends Component {
  constructor() {
    super();
    this.refreshInfo = this.refreshInfo.bind(this);
    this.state = {
      info: null,
      device: null,
      loading: false
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.device !== this.state.device) {
      this.refreshInfo(nextProps.device);
    }
  }

  refreshInfo(device = this.state.device) {
    console.log('Refresh Device Info', device);
    this.setState({ loading: true, device });
    myPost(RESOLVE_URL, {
      body: JSON.stringify({ context: { device } }),
    }).then(info => {
      this.setState({ info: info.data, loading: false });
    }).catch(e => {
      console.error('Error fetching asset info', e);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <div className='device-info'>
        <ReloadButton className='device-info-reload' loading={this.state.loading} icon={<Refresh />} onTouchTap={() => this.refreshInfo()} title='Refresh Device Info'/>
        <Table className='device-info-table' selectable={false}>
          <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn>Property</TableHeaderColumn>
              <TableHeaderColumn>Value</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>
            { this.state.info &&
              Object.keys(this.state.info).sort().map(k => {
                return (
                  <TableRow key={k} style={TABLE_ROW_STYLE}>
                    <TableRowColumn style={TABLE_ROW_STYLE}>{k}</TableRowColumn>
                    <TableRowColumn style={TABLE_ROW_STYLE}>{this.state.info[k]}</TableRowColumn>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </div>
    );
  }
}

export default DeviceInfo;
