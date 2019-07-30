import React from "react";
import Helmet from "react-helmet";
import { graphql } from "gatsby";
import GitHubButton from 'react-github-btn'
import Layout from "../layout";
import PostListing from "../components/PostListing/PostListing";
import SEO from "../components/SEO/SEO";
import config from "../../data/SiteConfig";

class Index extends React.Component {
  render() {
    const postEdges = this.props.data.allMarkdownRemark.edges;
    return (
      <Layout>
        <div className="index-container">
          <Helmet title={config.siteTitle} />
          <SEO />
          <div className="container">
            <div className="lead">
              <h1>{`Hi, I'm Sai`}</h1>
              <p>{`I'm a software developer ....`}</p>
              <div className="social-buttons">
                <div>
                  <a
                    className="twitter-follow-button"
                    href="https://twitter.com/funsaized"
                    data-size="large"
                    data-show-screen-name="false"
                  >
                    Follow @funsaized
                  </a>
                </div>
                <div>
                <GitHubButton
                  href="https://github.com/snimmagadda1"
                  data-size="large"
                  data-show-count="true"
                  aria-label="Follow @snimmagadda1 on GitHub"
                >
                  Follow
                </GitHubButton>
              </div>
              </div>
            </div>
          </div>
          <div className="container front-page">
            <section className="posts">
              <h2>Latest Articles</h2>
              <PostListing simple postEdges={postEdges} />
            </section>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Index;

/* eslint no-undef: "off" */
export const pageQuery = graphql`
  query IndexQuery {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [fields___date], order: DESC }
    ) {
      edges {
        node {
          fields {
            slug
            date
          }
          excerpt
          timeToRead
          frontmatter {
            title
            tags
            cover
            date
            thumbnail {
              childImageSharp {
                fixed(width: 50, height: 50) {
                  ...GatsbyImageSharpFixed
                }
              }
            }
          }
        }
      }
    }
  }
`;
