import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { Button, Menu } from 'antd';
import {
  txFormatter,
  transactionValueFormatter,
  transTimeFormatter,
  SuspenseFallback,
  getTransactions,
  updateTransactionStatus
} from '@utils';
import { Translation } from 'react-i18next';

const depositIcon = require('@assets/icon_deposit.svg');
const loadingIcon = require('@assets/icon_loading.svg');
const redeemIcon = require('@assets/icon_redeem.svg');
const failedIcon = require('@assets/icon_failed.svg');

export default class Transactions extends Component {
  componentDidMount() {
    this.loadHistory();
    var timer = setInterval(() => {
      const { walletAddress, network } = this.props.usr;
      if (walletAddress) {
        clearInterval(timer);
      }
      this.loadHistory();
    }, 1000);
  }

  loadHistory = () => {
    const { web3, walletAddress, network } = this.props.usr;
    const transArray = getTransactions({ walletAddress, network });

    if (transArray && transArray.length) {
      transArray.map(item => {
        if (item.status === 'init') {
          var timerObj = {};
          var tempRandom = Math.random();

          timerObj[tempRandom] = setInterval(() => {
            web3.eth.getTransactionReceipt(item.data.transactionHash, (resFail, resSuccess) => {
              if (resSuccess) {
                console.log(' *** i got getTransactionReceipt... *** ');
                console.log(resSuccess);
                updateTransactionStatus({
                  walletAddress,
                  network,
                  hash: resSuccess.transactionHash
                });
                clearInterval(timerObj[tempRandom]);

                setTimeout(() => {
                  console.log(' *** i load_history again *** ');
                  this.props.dispatch({
                    type: 'usr/updateRecentTransactions'
                  });
                }, 1000);
              }

              if (resFail) {
                console.log(resFail);
                updateTransactionStatus({
                  walletAddress,
                  network,
                  hash: resSuccess.transactionHash,
                  status: 'failed'
                });
                clearInterval(timerObj[tempRandom]);
              }
            });
          }, 2000);
        }
      });
    }
  }

  render() {
    let { recentTransactions, network } = this.props.usr;

    if (!recentTransactions.length) {
      return (
        <Suspense fallback={ <SuspenseFallback /> }>
          <Translation>
            {
              t => (
                <div className={styles.transactions}>
                  <h2>{ t('transactions.title') }</h2>

                  <div className={styles.transactions__null}>
                    <section>
                      <img src={require('@assets/no_history.svg')} />
                      <span>{ t('transactions.noHistory') }</span>
                    </section>
                  </div>
                </div>
              )
            }
          </Translation>
        </Suspense>
      );
    }

    return (
      <Suspense fallback={ <SuspenseFallback /> }>
        <Translation>
          {
            t => (
              <div className={styles.transactions} id="trans__box">
                <h2>{ t('transactions.title') }</h2>

                <div className={styles.transactions__box}>
                  {
                    recentTransactions.map((item, key) => {
                      return (
                        <section className={styles.transactions__item} key={key}>
                          <div className={styles.transactions__item_left}>
                            {
                              item.status === 'init'
                                ? <img
                                    src={loadingIcon}
                                    className={styles.transactions__item_icon_loading}
                                  />
                                : (
                                    item.status === 'failed'
                                      ? <img src={failedIcon} className={styles.transactions__item_icon} />
                                      : <img
                                          src={item.action === 'deposit' ? depositIcon : redeemIcon}
                                          className={styles.transactions__item_icon}
                                        />
                                  )
                            }
                          </div>

                          <div className={styles.transactions__item_right}>
                            <p>
                              { transTimeFormatter(item.time) || '-' }  |  { txFormatter(network, item.data.transactionHash) }
                            </p>
                            <label>
                              {
                                t(item.action === 'deposit' ? 'transactions.deposit' : 'transactions.redeem', {
                                  usdx: transactionValueFormatter(item.usdx),
                                  usr: transactionValueFormatter(item.usr)
                                })
                              }
                              </label>
                            {
                              /*
                              item.action === 'deposit'
                                ? <label>
                                  {
                                    t('transactions.deposit', {
                                      usdx: transactionValueFormatter(item.usdx),
                                      usr: transactionValueFormatter(item.usr)
                                    })
                                  }
                                  </label>
                                : <label>
                                  {
                                    t('transactions.redeem', {
                                      usdx: transactionValueFormatter(item.usdx),
                                      usr: transactionValueFormatter(item.usr)
                                    })
                                  }
                                  </label>
                              */
                            }
                          </div>
                        </section>
                      );
                    })
                  }
                </div>
              </div>
            )
          }
        </Translation>
      </Suspense>
    )
  };
}
