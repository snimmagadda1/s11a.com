import React, { Component } from "react";
import { Link } from "gatsby";

export default class Navbar extends Component {
  render() {
    const { menuLinks } = this.props

    return (
      <div className="nav">
        <div className="nav-container">
          <div className="me">Sai Nimmagadda</div>
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
