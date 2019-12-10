import React from "react";
import Helmet from "react-helmet";
import config from "../../data/SiteConfig";
import "./index.css";
import '../styles/main.scss'
import Navbar from '../components/Navbar/Navbar'

export default class MainLayout extends React.Component {
  render() {
    const { children } = this.props;
    return (
      <div>
        <Helmet>
          <meta name="description" content={config.siteDescription} />
        </Helmet>
        <Navbar menuLinks={config.menuLinks} />
        <main id="main-content">{children}</main>
        <div className="container footer">
          "testing"
          <div>
            <a href="https://github.com/snimmagadda1" title="Contribute on GitHub">
              {/* <img src="/static/github-d160ace5798527574789e89ec034e8f7.png" target="_blank" rel="noopener noreferrer" class="footer-img" alt="GitHub">
              </img> */}
              Github
            </a>
            <a href="https://www.netlify.com/" title="Hosted by Netlify">Netlify</a>
            <a href="https://www.gatsbyjs.org/" title="Built with Gatsby">Gatsby</a>
          </div>
        </div>
      </div>
    );
  }
}
