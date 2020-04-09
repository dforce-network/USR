// operation panel
import React, { Component } from 'react';
import styles from './index.less';
import { Row, Col, Tabs, Button, Form, Input } from 'antd';
// import { Translation } from 'react-i18next';
import { formatCurrencyNumber,  } from '@utils';
import { WadDecimal, transferUSDxToContract } from '@utils/web3Utils';

const { TabPane } = Tabs;
const usdxIcon = require('@assets/icon_usdx.svg');
class OperationPanel extends Component {
  state = {
    selectedPanel: 0
  }

  handleDeposit = () => {
    console.log(this.props.usr)
    transferUSDxToContract.bind(this)();
  }

  // max btn event
  handleMaxEvent = tag => {
    const { usdxBalance, usrBalance } = this.props.usr;
    if (tag === 'join') {
      // join
      this.props.dispatch({
        type: 'usr/updateParams',
        payload: {
          name: 'joinAmount',
          value: this.formatDecimalValue(usdxBalance)
        }
      });
    } else {
      // exit
      this.props.dispatch({
        type: 'usr/updateParams',
        payload: {
          name: 'exitAmount',
          value: this.formatDecimalValue(usrBalance)
        }
      });
    }
  }

  formatDecimalValue = v => {
    let value;
    try {
      value = new WadDecimal(v);
    } catch {
      if (v.length === 0) {
        value = new WadDecimal(0);
      } else {
        return 0;
      }
    }
    return value;
  }

  __renderDepositForm = () => {
    const { usdxBalance, receiveUSRValue } = this.props.usr;

    return (
      <Row className={styles.deposit__form}>
        <Col className={styles.usdx} span={24}>
          <span>
            <img src={usdxIcon} />
            USDx
          </span>
          <label>{ formatCurrencyNumber(usdxBalance) }</label>
        </Col>

        <Col className={styles.input} span={24}>
          <div className={styles.input__text}>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Amount in USDx"
              onChange={e => {
                this.props.dispatch({
                  type: 'usr/updateParams',
                  payload: {
                    name: 'joinAmount',
                    value: this.formatDecimalValue(e.target.value)
                  }
                });
              }}
            />
            <a href="javascript:void(0)" onClick={e => this.handleMaxEvent('join')}>MAX</a>
          </div>

          <p>You will receive approximately <b>{ formatCurrencyNumber(receiveUSRValue) }</b> USR</p>
        </Col>

        <Col span={24}>
          <Button
            type="primary"
            disabled={this.props.usr.joinAmount <= 0}
            block
            onClick={this.handleDeposit}
            className={styles.btn}
          >
            DEPOSIT
          </Button>
        </Col>
      </Row>
    );
  }

  __renderRedeemForm = () => {
    const { usrBalance, receiveUSDxValue } = this.props.usr;

    return (
      <Row className={styles.deposit__form}>
        <Col className={styles.usdx} span={24}>
          <span>
            USR
          </span>
          <label>{ formatCurrencyNumber(usrBalance) }</label>
        </Col>

        <Col className={styles.input} span={24}>
          <div className={styles.input__text}>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Amount in USR"
            />
            <a>MAX</a>
          </div>

          <p>You will receive at least <b>{ formatCurrencyNumber(receiveUSDxValue) }</b> USDx</p>
        </Col>

        <Col span={24}>
          <Button disabled type="primary" block className={styles.btn}>REDEEM</Button>
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
