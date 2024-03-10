import React from "react";
import Helmet from "react-helmet";
import { graphql } from "gatsby";
import Img from "gatsby-image";
import Layout from "../layout";
import UserInfo from "../components/UserInfo/UserInfo";
import Disqus from "../components/Disqus/Disqus";
import PostTags from "../components/PostTags/PostTags";
import SocialLinks from "../components/SocialLinks/SocialLinks";
import SEO from "../components/SEO/SEO";
import config from "../../data/SiteConfig";
import { formatDate, editOnGithub } from "../services/appConstants";
import "./post.css";

export default class PostTemplate extends React.Component {
  render() {
    const { data, pageContext } = this.props;
    const { slug } = pageContext;
    const postNode = data.markdownRemark;
    const post = postNode.frontmatter;
    const date = formatDate(post.date);

    const githubLink = editOnGithub(post);

    if (!post.id) {
      post.id = slug;
    }
    if (!post.category_id) {
      post.category_id = config.postDefaultCategoryID;
    }
    if (post.thumbnail) {
      thumbnail = post.thumbnail.childImageSharp.fixed;
    }
    return (
      <Layout>
        <div>
          <Helmet>
            <title>{`${post.title} | ${config.siteTitle}`}</title>
          </Helmet>
          <SEO postPath={slug} postNode={postNode} postSEO />
          <div className="container">
            <header className={"single-header no-thumbnail"} >
              <div>
                <h1>{post.title}</h1>
                <div className="post-meta">
                  <time className="date">By <strong>Sai Nimmagadda</strong> on {date}</time>
                  <span>| {post.time} |</span>
                  <a className="github-link" href={githubLink} target="_blank">
                    Edit on Github ✍️
                  </a>
                </div>
                <PostTags tags={post.tags} />
              </div>
            </header>
          </div>
        </div>
      </Layout>
    );
  }
}

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query NoteBySlug($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      timeToRead
      excerpt
      frontmatter {
        title
        thumbnail {
          childImageSharp {
            fixed(width: 150, height: 150) {
              ...GatsbyImageSharpFixed
            }
          }
        }
        slug
        cover
        date
        category
        tags
        time
      }
      fields {
        slug
        date
      }
    }
  }
`;
