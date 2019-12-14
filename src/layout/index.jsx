import React from "react";
import Helmet from "react-helmet";
import config from "../../data/SiteConfig";
import "./index.css";
import '../styles/main.scss'
import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer';

export default class MainLayout extends React.Component {
  render() {
    const { children } = this.props;
    return (
      <div>
        <Helmet>
          <meta name="description" content={config.siteDescription} />
        </Helmet>
        <Navbar menuLinks={config.menuLinks} />
        <main id="main-content">
          {children}
          <Footer></Footer>
        </main>

      </div>
    );
  }
}
