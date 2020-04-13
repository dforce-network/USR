import React, { Component } from 'react';
import styles from './index.less';
import PageFooter from '@components/PageFooter';
import '@services/i18n';

class BasicLayout extends Component {
  render() {
    return (
      <div className={styles.usr}>
        {this.props.children}
        <PageFooter />
      </div>
    );
  }
}

export default BasicLayout;
