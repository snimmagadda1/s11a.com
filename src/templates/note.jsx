import React from "react";
import Helmet from "react-helmet";
import moment from 'moment'
import Layout from "../layout";
import SEO from "../components/SEO/SEO";
import config from "../../data/SiteConfig";
import "./post.css";
import { slugToTitle } from "../services/appConstants";

export default class NoteTemplate extends React.Component {

  render() {
    const { pageContext } = this.props;
    const { noteFile, slug } = pageContext;
    // replace the string 'notes/' with '' to get the title
    const title = slugToTitle(slug.replace('/notes/', ''));
    return (
      <Layout>
        <div>
          <Helmet>
            <title>{`${title} | ${config.siteTitle}`}</title>
          </Helmet>
          <SEO postPath={slug} />
          <div className="container">
            <header className={"single-header no-thumbnail"} >
              <div>
                <h1>{title}</h1>
              </div>
            </header>
            <embed src={noteFile} style={{minHeight: "600px"}} type="application/pdf" width="100%" height="100%"/>
          </div>
        </div>
      </Layout>
    );
  }
}
