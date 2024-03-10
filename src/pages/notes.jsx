import React, { Component } from 'react'
import Helmet from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../layout'
// import PostListing from '../components/PostListing/PostListing'
import SEO from '../components/SEO/SEO'
import config from '../../data/SiteConfig'

export default class NotesPage extends Component {
  state = {
    searchTerm: '',
    notes: this.props.data.notes.nodes,
    filteredNotes: this.props.data.notes.nodes,
  }

  handleChange = async event => {
    const { name, value } = event.target
    console.warn('Handling change in notes listing with name:', name, 'and value:', value);

    await this.setState({ [name]: value })

    this.filterPosts()
  }

  filterPosts = () => {
    const { notes, searchTerm } = this.state

    let filteredNotes = notes.filter(notes =>
      notes.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    this.setState({ filteredNotes })
  }

  render() {
    const { filteredNotes, searchTerm } = this.state
    // todo
    const filterCount = filteredNotes.length

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
          <div className="notes">
            {
              filteredNotes.map(note => {
                return (
                  <h2>{note.name}</h2>
                )
              })
            }
          </div>
          {/* TODO: <NotesListing /> */}
          {/* <PostListing postEdges={filteredPosts} expanded={true}/> */}
        </div>
      </Layout>
    )
  }
}

export const pageQuery = graphql`query NotesQuery {
  notes: allFile(filter: {sourceInstanceName: {eq: "notes"}, extension: {eq: "pdf"}}) {
    nodes {
      name
    }
  }
}`
