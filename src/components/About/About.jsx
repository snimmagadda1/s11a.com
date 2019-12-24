import React, { Component } from "react";

class About extends Component {
  render() {
    return (
      <div className="about">
        <h1>About me</h1>
        <div className="content">
          <p>Hey there 👋! My name is Sai Nimmagadda. I currently work as a full stack software engineer and have a BSE in electrical and computer engineering and biomedical engineering from Duke.</p>
          <p>I'm hoping to grow this site in parallel with my exploration of new tech and open-source software.
            I also created this site to keep myself on track: I love the excitement that comes with contributing to the web and wanted a way combine my learning with contributing.
          </p>
          <p>I believe the best way to learn is through collaboration with others, so I'll be posting anything and everything I come across in the web that I think might be useful or interesting. 
            Hopefully others will find the knowledge/rants here useful.</p>
        </div>
      </div>
    );
  }
}

export default About;
