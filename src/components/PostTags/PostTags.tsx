import React, { Component } from "react";
import _ from "lodash";
import { Link } from "gatsby";


type Props = {
  tags: string[];
};

class PostTags extends Component<Props, {}> {
  render() {
    const { tags } = this.props;
    return (
      <div className="post-tag-container">
        {tags &&
          tags.map(tag => (
            <Link
              key={tag}
              style={{ textDecoration: "none" }}
              to={`/tags/${_.kebabCase(tag)}`}
            >
              <button>{tag}</button>
            </Link>
          ))}
      </div>
    );
  }
}

export default PostTags;
