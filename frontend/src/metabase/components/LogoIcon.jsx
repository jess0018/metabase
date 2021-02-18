import React, { Component } from "react";
import PropTypes from "prop-types";

import { PLUGIN_LOGO_ICON_COMPONENTS } from "metabase/plugins";

class DefaultLogoIcon extends Component {
  static defaultProps = {
    width: 100,
    height: 25,
  };
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    dark: PropTypes.bool,
  };

  render() {
    const { dark, height, width } = this.props;
    return (
      <img width={width} height={height} src="../app/assets/img/easybi_logo.png"></img>
    );
  }
}

export default function LogoIcon(props) {
  const [Component = DefaultLogoIcon] = PLUGIN_LOGO_ICON_COMPONENTS;
  return <Component {...props} />;
}
