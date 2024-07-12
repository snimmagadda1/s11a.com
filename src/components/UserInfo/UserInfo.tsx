import React, { Component } from "react";
import { Follow } from "react-twitter-widgets";
import { Config } from "../../models";

type Props = {
    config: Config,
    expanded: boolean
}

class UserInfo extends Component<Props, {}> {
  render() {
    const { userTwitter } = this.props.config;
    const { expanded } = this.props;
    return (
      <Follow
        username={userTwitter}
        options={{ count: expanded ? true : "none" }}
      />
    );
  }
}

export default UserInfo;
