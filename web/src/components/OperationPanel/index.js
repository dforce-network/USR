// operation panel
import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { Row, Col, Tabs, Button, Input, message } from 'antd';
import { Translation, Trans } from 'react-i18next';
import { formatCurrencyNumber, SuspenseFallback } from '@utils';
import { WadDecimal, mintUSR, burnUSR } from '@utils/web3Utils';

const { TabPane } = Tabs;
const usdxIcon = require('@assets/icon_usdx.svg');

export default class OperationPanel extends Component {
  state = {
    selectedPanel: 0
  }

  // deposit function
  handleDeposit = () => {
    const { joinAmount, shareValue } = this.props.usr;

    // if (!joinAmount) {
    //   message.warn('Deposit value should greater than 0!');
    //   return;
    // }
    //
    // if (joinAmount.cmp(shareValue) > 0) {
    //   message.warning('Deposit value should less than ' + formatCurrencyNumber(shareValue));
    //   return;
    // }

    if (joinAmount) {
      this.props.dispatch({
        type: 'usr/updateBtnDisable',
        payload: {
          name: 'deposit',
          disable: true
        }
      });
      mintUSR.bind(this)();
    }
  }

  // redeem function
  handleRedeem = () => {
    const { exitAmount, usrBalance } = this.props.usr;

    // if (!exitAmount) {
    //   message.warn('Redeem value should greater than 0!');
    //   return;
    // }
    //
    // if (exitAmount.cmp(usrBalance) > 0) {
    //   message.warning('Redeem value should less than ' + formatCurrencyNumber(usrBalance));
    //   return;
    // }

    if (exitAmount) {
      this.props.dispatch({
        type: 'usr/updateBtnDisable',
        payload: {
          name: 'redeem',
          disable: true
        }
      });
      burnUSR.bind(this)();
    }
  }

  // max btn event
  handleMaxEvent = tag => {
    let {
      usdxBalance,
      usrBalance,
      exchangeRate,
      receiveUSRValue,
      receiveUSDxValue,
      shareValue
    } = this.props.usr;

    if (tag === 'join') {
      // join
      let usdxShowValue = 0;
      let joinAmount = this.formatDecimalValue(usdxBalance || 0);

      if (usdxBalance) {
        usdxShowValue = parseFloat(usdxBalance).toFixed(2);
        receiveUSRValue = usdxShowValue * exchangeRate;
      }

      this.props.dispatch({
        type: 'usr/updateMultiParams',
        payload: {
          usdxShowValue,
          receiveUSRValue,
          joinAmount,
          depositDisable: joinAmount.cmp(shareValue) > 0
        }
      });
    } else {
      // exit
      let usrShowValue = 0;
      let exitAmount = this.formatDecimalValue(usrBalance || 0);

      if (usrBalance) {
        usrShowValue = parseFloat(usrBalance).toFixed(2);
        receiveUSDxValue = usrShowValue / exchangeRate;
      }

      this.props.dispatch({
        type: 'usr/updateMultiParams',
        payload: {
          usrShowValue,
          receiveUSDxValue,
          exitAmount,
          redeemDisable: exitAmount.cmp(usrBalance) > 0
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
    const { usdxBalance, receiveUSRValue, exchangeRate, depositLoading, shareValue} = this.props.usr;

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
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
                      placeholder={ t('operation.deposit.placeholder') }
                      onFocus={e => {
                        e.target.select();
                      }}
                      onChange={e => {
                        let joinAmount = this.formatDecimalValue(e.target.value);

                        this.props.dispatch({
                          type: 'usr/updateMultiParams',
                          payload: {
                            usdxShowValue: e.target.value
                          }
                        });

                        if (joinAmount.cmp(shareValue) > 0) {
                          this.props.dispatch({
                            type: 'usr/updateBtnDisable',
                            payload: {
                              name: 'deposit',
                              disable: true,
                              notChange: true
                            }
                          });
                        } else {
                          this.props.dispatch({
                            type: 'usr/updateMultiParams',
                            payload: {
                              joinAmount,
                              depositDisable: false,
                              usdxShowValue: e.target.value,
                              receiveUSRValue: this.formatDecimalValue(joinAmount * exchangeRate)
                            }
                          });
                        }
                      }}
                    />
                    <a onClick={e => this.handleMaxEvent('join')}>{ t('operation.deposit.max') }</a>
                  </div>
                  <p>{ t('operation.deposit.tip') } <b>{ formatCurrencyNumber(receiveUSRValue) }</b> USR</p>
                </Col>

                <Col span={24}>
                  <Button
                    type="primary"
                    disabled={this.props.usr.joinAmount <= 0 || this.props.usr.depositDisable}
                    block
                    onClick={this.handleDeposit}
                    className={styles.btn}
                  >
                    { t('operation.deposit.btnNormal') }
                  </Button>
                </Col>
              </Row>
            )
          }
        </Translation>
      </Suspense>
    );
  }

  __renderRedeemForm = () => {
    const { usrBalance, receiveUSDxValue, exchangeRate, redeemLoading } = this.props.usr;

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
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
                      placeholder={ t('operation.redeem.placeholder') }
                      onFocus={e => {
                        e.target.select();
                      }}
                      onChange={e => {
                        let exitAmount = this.formatDecimalValue(e.target.value);

                        this.props.dispatch({
                          type: 'usr/updateMultiParams',
                          payload: {
                            usrShowValue: e.target.value
                          }
                        });

                        if (exitAmount.cmp(usrBalance) > 0) {
                          this.props.dispatch({
                            type: 'usr/updateBtnDisable',
                            payload: {
                              name: 'redeem',
                              disable: true,
                              notChange: true
                            }
                          });
                        } else {
                          this.props.dispatch({
                            type: 'usr/updateMultiParams',
                            payload: {
                              exitAmount,
                              redeemDisable: false,
                              usrShowValue: e.target.value,
                              receiveUSDxValue: this.formatDecimalValue(exitAmount / exchangeRate)
                            }
                          });
                        }
                      }}
                    />
                    <a onClick={e => this.handleMaxEvent('exit')}>{ t('operation.redeem.max') }</a>
                  </div>

                  <p>{ t('operation.redeem.tip') } <b>{ formatCurrencyNumber(receiveUSDxValue) }</b> USDx</p>
                </Col>

                <Col span={24}>
                  <Button
                    disabled={this.props.usr.exitAmount <= 0 || this.props.usr.redeemDisable}
                    block
                    type="primary"
                    className={styles.btn}
                    onClick={this.handleRedeem}
                    loading={redeemLoading}
                  >
                    { t('operation.redeem.btnNormal') }
                  </Button>
                </Col>
              </Row>
            )
          }
        </Translation>
      </Suspense>
    );
  }

  render() {
    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
              <section className={styles.box}>
                <div className={styles.box__content}>
                  <Tabs
                    defaultActiveKey="1"
                    tabBarGutter={0}
                    tabBarStyle={{
                      color: '#7a7b9e',
                    }}
                  >
                    <TabPane tab={ t('operation.deposit.title') } key="1">
                      { this.__renderDepositForm() }
                    </TabPane>
                    <TabPane tab={ t('operation.redeem.title') } key="2">
                      { this.__renderRedeemForm() }
                    </TabPane>
                  </Tabs>
                 </div>
              </section>
            )
          }
        </Translation>
      </Suspense>
    );
  }
}
