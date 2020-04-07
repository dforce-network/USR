import React, { Component } from 'react';
import { Button, Menu, Dropdown, Drawer } from 'antd';
import styles from './index.less';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';

const downSvg = require('@assets/icon_xl.svg');
export default class PageHeader extends Component {
  state = {
    drawerVisible: false
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

  render() {
    const stablecoinMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
            <span>USDx</span>
            <label>Portal</label>
          </a>
        </Menu.Item>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
            <span>USR</span>
            <label>Saving and Accuring interest</label>
          </a>
        </Menu.Item>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
            <span>DIP001</span>
            <label>Collateral lending dashboard</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    const lendfMeMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
            <span>LendfMe</span>
            <label>Lend and Borrow with Incredible Interest</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    const swapMenu = (
      <Menu className={styles.header__overlay}>
        <Menu.Item>
          <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
            <span>X-Swap</span>
            <label>Trade Stable Asset with Zero Slippage</label>
          </a>
        </Menu.Item>
      </Menu>
    );

    return (
      <div className={styles.header}>
        <a href="/" className={styles.header__logo}>
          <img src={require('@assets/logo.svg')} />
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
              <img src={downSvg} />
            </span>
          </Dropdown>

          <Dropdown overlay={lendfMeMenu}>
            <span className={styles.header__menu_item}>
              <label>Yield Market</label>
              <img src={downSvg} />
            </span>
          </Dropdown>

          <Dropdown overlay={swapMenu}>
            <span className={styles.header__menu_item}>
              <label>Exchange Market</label>
              <img src={downSvg} />
            </span>
          </Dropdown>

          <a className={styles.header__menu_wallet}>7b79…10f4</a>
        </div>

        <Drawer
          title={(
            <section className={styles.header}>
              <a href="/" className={styles.header__logo}>
                <img src={require('@assets/logo.svg')} />
              </a>

              <CloseOutlined onClick={this.onClose} />
            </section>
          )}
          placement='top'
          closable={false}
          onClose={this.onClose}
          visible={this.state.drawerVisible}
          height="640"
        >
          <section className={styles.header__drawer}>
            <h2>dForce Stablecoin</h2>
            <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
              <span>USDx</span>
              <label>Portal</label>
            </a>
            <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
              <span>USR</span>
              <label>Saving and Accuring interest</label>
            </a>
            <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
              <span>DIP001</span>
              <label>Collateral lending dashboard</label>
            </a>
          </section>

          <section className={styles.header__drawer}>
            <h2>Yield Market</h2>
            <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
              <span>LendfMe</span>
              <label>Lend and Borrow with Incredible Interest</label>
            </a>
          </section>

          <section className={styles.header__drawer}>
            <h2>Exchange Market</h2>
            <a target="_blank" rel="noopener noreferrer" href="" className={styles.header__overlay_item}>
              <span>X-Swap</span>
              <label>Trade Stable Asset with Zero Slippage</label>
            </a>
          </section>
        </Drawer>
      </div>
    )
  };
}
