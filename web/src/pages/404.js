import router from 'umi/router';
import React, { PureComponent } from 'react';

export default class NoPage extends PureComponent {
  componentDidMount() {
    router.push('/');
  }

  render() {
    return <></>;
  }
}
