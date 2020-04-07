import React, { Component } from 'react';
import styles from './index.less';
import { Button, Menu } from 'antd';

const depositIcon = require('@assets/icon_deposit.svg');
const redeemIcon = require('@assets/icon_redeem.svg');

export default class Transactions extends Component {
  state = {
    anchorEl: null,
  }

  render() {
    return (
      <div className={styles.transactions}>
        <h2>Recent Transactions</h2>

        <div>
          <section className={styles.transactions__item}>
            <img src={depositIcon} className={styles.transactions__item_icon} />

            <div>
              <p>Mar 24, 2019 at 10:26:40  |  <a>Tx-Hash</a></p>
              <label>Redeem 200 USR, Receive199.743864 USDx</label>
            </div>
          </section>

          <section className={styles.transactions__item}>
            <img src={redeemIcon} className={styles.transactions__item_icon} />

            <div>
              <p>Mar 24, 2019 at 10:26:40  |  <a>Tx-Hash</a></p>
              <label>Redeem 200 USR, Receive199.743864 USDx</label>
            </div>
          </section>
        </div>
      </div>
    )
  };
}
