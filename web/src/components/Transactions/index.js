import React, { Component } from 'react';
import styles from './index.less';
import { Button, Menu } from 'antd';
import { txFormatter } from '@utils';

const depositIcon = require('@assets/icon_deposit.svg');
const redeemIcon = require('@assets/icon_redeem.svg');

export default class Transactions extends Component {
  state = {
    anchorEl: null,
  }

  render() {
    let { recentTransactions, network } = this.props.usr;
    // recentTransactions = []
    if (!recentTransactions.length) {
      return (
        <div className={styles.transactions}>
          <h2>Recent Transactions</h2>

          <div className={styles.transactions__null}>
            <section>
              <img src={require('@assets/no_history.svg')} />
              <span>No History</span>
            </section>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.transactions}>
        <h2>Recent Transactions</h2>

        <div className={styles.transactions__box}>
          {
            recentTransactions.map((item, key) => {
              return (
                <section className={styles.transactions__item} key={key}>
                  <div className={styles.transactions__item_left}>
                    <img
                      src={item.action === 'deposit' ? depositIcon : redeemIcon}
                      className={styles.transactions__item_icon}
                    />
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
                        ? <label>Deposit { item.usdx } USDx, Receive { item.usr } USR</label>
                        : <label>Redeem { item.usr } USR, Receive { item.usdx } USDx</label>
                    }
                  </div>
                </section>
              );
            })
          }
        </div>
      </div>
    )
  };
}
