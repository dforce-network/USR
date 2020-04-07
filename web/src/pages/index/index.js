import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';
// import { Translation } from 'react-i18next';
import OperationPanel from '@components/OperationPanel';
import Overview from '@components/Overview';
import Transactions from '@components/Transactions';
import styles from './index.less';


export default class Index extends Component {
  render() {
    return (
      <div className={styles.home}>
        <Row>
          <Col lg={12} xs={24}>
            <OperationPanel { ...this.props } />
          </Col>

          <Col lg={12} xs={24}>
            <Overview { ...this.props } />
          </Col>
        </Row>

        <Transactions />
      </div>
    );
  }
}
