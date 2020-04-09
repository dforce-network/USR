// operation panel
import React, { Component } from 'react';
import styles from './index.less';
import { Row, Col, Tabs, Button, Form, Input, message } from 'antd';
// import { Translation } from 'react-i18next';
import { formatCurrencyNumber,  } from '@utils';
import { WadDecimal, mintUSR, burnUSR } from '@utils/web3Utils';

const { TabPane } = Tabs;
const usdxIcon = require('@assets/icon_usdx.svg');
class OperationPanel extends Component {
  state = {
    selectedPanel: 0
  }

  // deposit function
  handleDeposit = () => {
    const { joinAmount, usdxBalance } = this.props.usr;

    if (!joinAmount) {
      message.warn('Deposit value should greater than 0!');
      return;
    }

    if (joinAmount.cmp(usdxBalance) > 0) {
      message.warning('Deposit value should less than ' + formatCurrencyNumber(usdxBalance));
      return;
    }

    mintUSR.bind(this)();
  }

  // redeem function
  handleRedeem = () => {
    const { exitAmount, usrBalance } = this.props.usr;

    if (!exitAmount) {
      message.warn('Redeem value should greater than 0!');
      return;
    }

    if (exitAmount.cmp(usrBalance) > 0) {
      message.warning('Redeem value should less than ' + formatCurrencyNumber(usrBalance));
      return;
    }

    burnUSR.bind(this)();
  }

  // max btn event
  handleMaxEvent = tag => {
    let { usdxBalance, usrBalance, exchangeRate, receiveUSRValue, receiveUSDxValue } = this.props.usr;

    if (tag === 'join') {
      // join
      let usdxShowValue = 0;

      if (usdxBalance) {
        usdxShowValue = parseFloat(usdxBalance).toFixed(2);
        receiveUSRValue = usdxShowValue * exchangeRate;
      }

      this.props.dispatch({
        type: 'usr/updateMultiParams',
        payload: {
          usdxShowValue,
          receiveUSRValue,
          joinAmount: this.formatDecimalValue(usdxBalance)
        }
      });
    } else {
      // exit
      let usrShowValue = 0;

      if (usrBalance) {
        usrShowValue = parseFloat(usrBalance).toFixed(2);
        receiveUSDxValue = usrShowValue / exchangeRate;
      }

      this.props.dispatch({
        type: 'usr/updateMultiParams',
        payload: {
          usrShowValue,
          receiveUSDxValue,
          exitAmount: this.formatDecimalValue(usrBalance)
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
    const { usdxBalance, receiveUSRValue, exchangeRate } = this.props.usr;

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
              value={this.props.usr.usdxShowValue}
              placeholder="Amount in USDx"
              onFocus={e => {
                e.target.select();
              }}
              onChange={e => {
                let joinAmount = this.formatDecimalValue(e.target.value);

                this.props.dispatch({
                  type: 'usr/updateMultiParams',
                  payload: {
                    joinAmount,
                    usdxShowValue: e.target.value,
                    receiveUSRValue: this.formatDecimalValue(joinAmount * exchangeRate)
                  }
                });
              }}
            />
            <a onClick={e => this.handleMaxEvent('join')}>MAX</a>
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
    const { usrBalance, receiveUSDxValue, exchangeRate } = this.props.usr;

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
              value={this.props.usr.usrShowValue}
              placeholder="Amount in USR"
              onFocus={e => {
                e.target.select();
              }}
              onChange={e => {
                let exitAmount = this.formatDecimalValue(e.target.value);

                this.props.dispatch({
                  type: 'usr/updateMultiParams',
                  payload: {
                    exitAmount,
                    usrShowValue: e.target.value,
                    receiveUSDxValue: this.formatDecimalValue(exitAmount / exchangeRate)
                  }
                });
              }}
            />
            <a onClick={e => this.handleMaxEvent('exit')}>MAX</a>
          </div>

          <p>You will receive at least <b>{ formatCurrencyNumber(receiveUSDxValue) }</b> USDx</p>
        </Col>

        <Col span={24}>
          <Button
            disabled={this.props.usr.exitAmount <= 0}
            block
            type="primary"
            className={styles.btn}
            onClick={this.handleRedeem}
          >
            REDEEM
          </Button>
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