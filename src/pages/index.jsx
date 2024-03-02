import React from "react";
import Helmet from "react-helmet";
import { graphql } from "gatsby";
import GitHubButton from "react-github-btn";
import Layout from "../layout";
import PostListing from "../components/PostListing/PostListing";
import ProjectListing from "../components/ProjectListing/ProjectListing";
import SEO from "../components/SEO/SEO";
import config from "../../data/SiteConfig";
import projects from '../../data/projects'

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
              <h1>Hi, I'm Sai</h1>
              <p>I'm a full stack software engineer focused on using tech to find novel solutions to today's problems. My day to day focus is largely in the healthcare sphere. I build things, contribute to open source, and love a good challenge.</p>
              <div className="social-buttons">
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
              <h2>Articles</h2>
              <PostListing simple postEdges={postEdges} />
            </section>

            <section className="section">
              <h2>OSS & Projects</h2>
              <ProjectListing projects={projects} />
          </section>
          </div>
        </div>
      </Layout>
    );
  }
}

export default Index;

/* eslint no-undef: "off" */
export const pageQuery = graphql`query IndexQuery {
  allMarkdownRemark(
      limit: 2000, 
      sort: {fields: {date: DESC}},
      filter: {frontmatter: {type: {eq: "post"}}}
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
}`;
