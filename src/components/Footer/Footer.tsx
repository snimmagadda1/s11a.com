import React, { Component } from "react";
import netlify from '../../../static/logos/netlify.png';
import github from '../../../static/logos/octocat.png';
import gatsby from '../../../static/logos/gatsby.png'
import "./Footer.css";

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <div className="container footer">
            <a href="https://github.com/snimmagadda1" title="Contribute on GitHub">
              <img
                src={github}
                rel="noopener noreferrer"
                className="footer-image"
                alt="GitHub"
              />
            </a>
            <a href="https://www.netlify.com/" title="Hosted by Netlify">
              <img
                src={netlify}
                rel="noopener noreferrer"
                className="footer-image"
                alt="Netlify"
              />
            </a>
            <a href="https://www.gatsbyjs.org/" title="Built with Gatsby">
              <img
                src={gatsby}
                rel="noopener noreferrer"
                className="footer-image"
                alt="Gatsby"
              />
            </a>
        </div>
      </footer>
    );
  }
}

export default Footer;
