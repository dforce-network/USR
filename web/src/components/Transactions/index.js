import React, { Component } from 'react';
import styles from './index.less';
import { Button, Menu } from 'antd';

const depositIcon = require('@assets/icon_deposit.svg');
const redeemIcon = require('@assets/icon_redeem.svg');

export default class Transactions extends Component {
  state = {
    anchorEl: null,
  }

  componentDidMount() {
    let transactions = [
      {
        action: 'deposit',
        time: new Date(),
        hash: '',
        usr: '300',
        usdx: '100',
      }
    ];
  }

  render() {
    const { recentTransactions } = this.props.usr;
    if (!recentTransactions.length) {
      return <></>;
    }

    return (
      <div className={styles.transactions}>
        <h2>Recent Transactions</h2>

        <div>
          {
            recentTransactions.map((item, key) => {
              return (
                <section className={styles.transactions__item} key={key}>
                  <img
                    src={item.action === 'deposit' ? depositIcon : redeemIcon}
                    className={styles.transactions__item_icon}
                  />

                  <div>
                    <p>Mar 24, 2019 at 10:26:40  |  <a href={`${item.data.transactionHash}`}>Tx-Hash</a></p>
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
