import React, { Component } from 'react';
import { Menu, Dropdown, Drawer } from 'antd';
import styles from './index.less';
import { MenuOutlined } from '@ant-design/icons';
import { initBrowserWallet } from '@utils/web3Utils';
import { connect } from 'dva';
import { accountHideFormatter } from '@utils';
import { Trans } from 'react-i18next';

const downSvg = require('@assets/icon_xl.svg');

@connect(({ usr }) => ({ usr }))
class PageHeader extends Component {
  state = {
    drawerVisible: false
  }

  dispatchValue = (name, value) => {
    this.props.dispatch({
      type: 'usr/updateParams',
      payload: {
        name,
        value
      }
    });
  }

  onClose = () => {
    this.setState({
      drawerVisible: false
    });
  }

  openMenu = () => {
    this.setState({
      drawerVisible: true
    });
  }

  // connect wallet
  connectWallet = async () => {
    initBrowserWallet.bind(this)(this.dispatchValue);
  }

  render() {
    const { walletAddress } = this.props.usr;

    const stablecoinMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="https://usdx.dforce.network/" className={styles.header__overlay_item}>
            <span>USDx</span>
            <label>Portal</label>
          </a>
        </Menu.Item>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
            <span>USR</span>
            <label>Saving and Accuring interest</label>
          </a>
        </Menu.Item>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="https://dip001.dforce.network" className={styles.header__overlay_item}>
            <span>DIP001</span>
            <label>Collateral lending dashboard</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    const lendfMeMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="https://lendf.me" className={styles.header__overlay_item}>
            <span>LendfMe</span>
            <label>Lend and Borrow with Incredible Interest</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    const swapMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
            <span>X-Swap</span>
            <label>Trade Stable Asset with Zero Slippage</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className={styles.header}>
        <a href="/" className={styles.header__logo}>
          <img src={require('@assets/logo.svg')} alt="logo" />
        </a>

        <MenuOutlined
          className={styles.header__dropdown}
          style={{fontSize: '20px', fontWeight: 'bold'}}
          onClick={this.openMenu}
        />

        <div className={styles.header__menu}>
          <Dropdown overlay={stablecoinMenu}>
            <span className={styles.header__menu_item}>
              <label>dForce Stablecoin</label>
              <img src={downSvg} alt="down" />
            </span>
          </Dropdown>

          <Dropdown overlay={lendfMeMenu}>
            <span className={styles.header__menu_item}>
              <label>Yield Market</label>
              <img src={downSvg} alt="down" />
            </span>
          </Dropdown>

          <Dropdown overlay={swapMenu}>
            <span className={styles.header__menu_item}>
              <label>Exchange Market</label>
              <img src={downSvg} alt="down" />
            </span>
          </Dropdown>

          {
            walletAddress
              ?  (
                <a
                  className={styles.header__menu_wallet}
                  href={
                    this.props.usr.network == 1
                      ? `https://etherscan.com/address/${walletAddress}`
                      : `https://rinkeby.etherscan.io/address/${walletAddress}`
                  }
                  target="_blank"
                >
                  <i style={{ backgroundColor: this.props.usr.network == 1 ? '#29B6AF' : 'orange' }}></i>
                  { accountHideFormatter(walletAddress) }
                </a>
              )
              : <a className={styles.header__menu_wallet} onClick={this.connectWallet}>Connect Wallet</a>
          }

        </div>

        <Drawer
          title={(
            <section className={styles.header}>
              <a href="/" className={styles.header__logo}>
                <img src={require('@assets/logo.svg')} alt="logo" />
              </a>

              <img className={styles.header__close} alt="close" onClick={this.onClose} src={require('@assets/icon_close.svg')} />
            </section>
          )}
          placement='top'
          closable={false}
          onClose={this.onClose}
          visible={this.state.drawerVisible}
          height="640"
        >
          <section className={styles.header__drawer}>
            <h2>
              dForce Stablecoin
              <img src={require('@assets/icon_down.svg')} alt="down" />
            </h2>
            <a target="_blank" rel="noopener noreferrer" href="https://usdx.dforce.network" className={styles.header__overlay_item}>
              <span>USDx</span>
              <label>Portal</label>
            </a>
            <a target="_blank" rel="noopener noreferrer" href="/" className={styles.header__overlay_item}>
              <span>USR</span>
              <label>Saving and Accuring interest</label>
            </a>
            <a target="_blank" rel="noopener noreferrer" href="https://dip001.dforce.network" className={styles.header__overlay_item}>
              <span>DIP001</span>
              <label>Collateral lending dashboard</label>
            </a>
          </section>

          <section className={styles.header__drawer}>
            <h2>
              Yield Market
              <img src={require('@assets/icon_down.svg')} alt="down" />
            </h2>
            <a target="_blank" rel="noopener noreferrer" href="https://lendf.me" className={styles.header__overlay_item}>
              <span>LendfMe</span>
              <label>Lend and Borrow with Incredible Interest</label>
            </a>
          </section>

          <section className={styles.header__drawer}>
            <h2>
              Exchange Market
              <img src={require('@assets/icon_down.svg')} alt="down" />
            </h2>
            <a target="_blank" href="/" className={styles.header__overlay_item}>
              <span>X-Swap</span>
              <label>Trade Stable Asset with Zero Slippage</label>
            </a>
          </section>
        </Drawer>
      </div>
    )
  };
}

export default PageHeader;
