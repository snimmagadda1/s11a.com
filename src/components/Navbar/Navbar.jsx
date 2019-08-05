import React, { Component } from "react";
import { Link } from "gatsby";
import face from "../../images/face.png";

export default class Navbar extends Component {
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
              <img src={face} className="favicon" alt="Face" />
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
