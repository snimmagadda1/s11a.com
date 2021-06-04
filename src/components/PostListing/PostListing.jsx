import React from "react";
import Img from 'gatsby-image'
import { Link } from "gatsby";

class PostListing extends React.Component {
  getPostList() {
    const postList = [];
    this.props.postEdges.forEach(postEdge => {
      postList.push({
        path: postEdge.node.fields.slug,
        tags: postEdge.node.frontmatter.tags,
        cover: postEdge.node.frontmatter.cover,
        title: postEdge.node.frontmatter.title,
        thumbnail: postEdge.node.frontmatter.thumbnail,
        date: postEdge.node.fields.date,
        excerpt: postEdge.node.excerpt,
        timeToRead: postEdge.node.timeToRead,
        isdev: postEdge.node.frontmatter.isdev
      });
    });
    return postList;
  }
  render() {
    const postList = this.getPostList();
    const { expanded } = this.props

    return (
      <div className={`posts ${expanded ? 'expanded' : ''}`}>
        {postList.map(post => {
          let thumbnail;
          if (post.thumbnail) {
            thumbnail = post.thumbnail.childImageSharp.fixed;
          }

          return (
            <Link to={post.path} key={post.title}>
               <div className="post-info">
                <div className="icon">
                  {thumbnail ? <Img fixed={thumbnail} /> : <div />}
                </div>
                <div className="post-line">
                  <h2>{post.title}</h2>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }
}

export default PostListing;
