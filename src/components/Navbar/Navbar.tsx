import React, { Component } from "react";
import { Link } from "gatsby";
import { StaticImage } from "gatsby-plugin-image"
import { MenuLink } from "../../models";

type Props = {
  menuLinks: MenuLink[]
}

type State = {
  scrolled: boolean;
};

export default class Navbar extends Component<Props, State> {
  state = {
    scrolled: false
  };

  componentDidMount() {
    window.addEventListener("scroll", this.navOnScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.navOnScroll);
  }

  navOnScroll = () => {
    if (window.scrollY > 20) {
      this.setState({ scrolled: true });
    } else {
      this.setState({ scrolled: false });
    }
  };

  render() {
    const { scrolled } = this.state;
    const { menuLinks } = this.props;

    return (
      <div className={scrolled ? "nav scroll" : "nav"}>
        <div className="nav-container">
          <div className="me">
            <Link key="sai" to="/" activeClassName="active">
              <StaticImage src="../../images/face.png" className="favicon" alt="Face" />
              <span className="text">Sai Nimmagadda</span>
            </Link>
          </div>
          <div className="links">
            {menuLinks.map(link => (
              <Link key={link.name} to={link.link} activeClassName="active">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
