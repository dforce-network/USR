import React, { Component, Suspense } from 'react';
import styles from './index.less';
import { Button, Menu } from 'antd';
import { txFormatter, SuspenseFallback } from '@utils';
import { Translation } from 'react-i18next';

const depositIcon = require('@assets/icon_deposit.svg');
const loadingIcon = require('@assets/icon_loading.svg');
const redeemIcon = require('@assets/icon_redeem.svg');

export default class Transactions extends Component {
  state = {
    anchorEl: null,
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
              <div className={styles.transactions}>
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
                                : <img
                                    src={item.action === 'deposit' ? depositIcon : redeemIcon}
                                    className={styles.transactions__item_icon}
                                  />
                            }
                          </div>

                          <div className={styles.transactions__item_right}>
                            <p>
                              { item.time || '-' }  |
                              <a
                                target="_blank"
                                href={ txFormatter(network, item.data.transactionHash) }
                              > Tx-Hash
                              </a>
                            </p>
                            {
                              item.action === 'deposit'
                                ? <label>{ t('transactions.deposit', { usdx: item.usdx, usr: item.usr }) }</label>
                                : <label>{ t('transactions.redeem', { usdx: item.usdx, usr: item.usr }) }</label>
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
