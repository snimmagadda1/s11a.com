import React, { Component } from 'react'
import Helmet from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../layout'
import PostListing from '../components/PostListing/PostListing'
import SEO from '../components/SEO/SEO'
import config from '../../data/SiteConfig'

export default class NotesPage extends Component {
  state = {
    searchTerm: '',
    posts: this.props.data.posts.edges,
    filteredPosts: this.props.data.posts.edges,
  }

  handleChange = async event => {
    const { name, value } = event.target

    await this.setState({ [name]: value })

    this.filterPosts()
  }

  filterPosts = () => {
    const { posts, searchTerm, currentCategories } = this.state

    let filteredPosts = posts.filter(post =>
      post.node.frontmatter.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    this.setState({ filteredPosts })
  }

  render() {
    const { filteredPosts, searchTerm } = this.state
    const filterCount = filteredPosts.length

    return (
      <Layout>
        <Helmet title={`Notes – ${config.siteTitle}`} />
        <SEO />
        <div className="container">
          <h1>Notes</h1>
          <div className="search-container">
            <input
              className="search"
              type="text"
              name="searchTerm"
              value={searchTerm}
              placeholder="Type here to filter notes..."
              onChange={this.handleChange}
            />
            <div className="filter-count">{filterCount}</div>
          </div>
          <PostListing postEdges={filteredPosts} expanded={true}/>
        </div>
      </Layout>
    )
  }
}

export const pageQuery = graphql`query BlogQuery {
  posts: allMarkdownRemark(
      limit: 2000, 
      sort: {fields: {date: DESC}},
      filter: {frontmatter: {type: {eq: "note"}}}
    ) {
    edges {
      node {
        fields {
          slug
          date
        }
        excerpt(pruneLength: 180)
        timeToRead
        frontmatter {
          title
          tags
          categories
          thumbnail {
            childImageSharp {
              fixed(width: 70, height: 70) {
                ...GatsbyImageSharpFixed
              }
            }
          }
          date
        }
      }
    }
  }
}`
