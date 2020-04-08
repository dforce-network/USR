// operation panel
import React, { Component } from 'react';
import styles from './index.less';
import { Row, Col, Tabs, Button, Form, Input } from 'antd';
// import { Translation } from 'react-i18next';

const { TabPane } = Tabs;
const usdxIcon = require('@assets/icon_usdx.svg');
class OperationPanel extends Component {
  state = {
    selectedPanel: 0
  }

  handleDeposit = () => {
    console.log(this.props.usr)
  }

  __renderDepositForm = () => {
    return (
      <Row className={styles.deposit__form}>
        <Col className={styles.usdx} span={24}>
          <span>
            <img src={usdxIcon} />
            USDx
          </span>
          <label>123,456,789.12</label>
        </Col>

        <Col className={styles.input} span={24}>
          <Input placeholder="Amount in USDx" />

          <p>You will receive approximately <b>0.98231567</b> USR</p>
        </Col>

        <Col span={24}>
          <Button type="primary" onClick={this.handleDeposit} block className={styles.btn}>DEPOSIT</Button>
        </Col>
      </Row>
    );
  }

  __renderRedeemForm = () => {
    return (
      <Row className={styles.deposit__form}>
        <Col className={styles.usdx} span={24}>
          <span>
            USR
          </span>
          <label>123,456,789.12</label>
        </Col>

        <Col className={styles.input} span={24}>
          <Input placeholder="Amount in USR" />

          <p>You will receive at least <b>0.98231567</b> USDx</p>
        </Col>

        <Col span={24}>
          <Button type="primary" block className={styles.btn}>REDEEM</Button>
        </Col>
      </Row>
    );
  }

  render() {
    return (
      // <Translation>
      //   {
      //     t => (
            <section className={styles.box}>
              <div className={styles.box__content}>
                <Tabs
                  defaultActiveKey="1"
                  tabBarGutter={0}
                  tabBarStyle={{
                    color: '#7a7b9e',
                  }}
                >
                  <TabPane tab="DEPOSIT" key="1">
                    { this.__renderDepositForm() }
                  </TabPane>
                  <TabPane tab="REDEEM" key="2">
                    { this.__renderRedeemForm() }
                  </TabPane>
                </Tabs>
               </div>
            </section>
      //     )
      //   }
      // </Translation>
    );
  }
}

export default OperationPanel;
