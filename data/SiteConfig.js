const config = {
  siteTitle: "s11a Programming Blog", // Site title.
  siteTitleShort: "s11a", // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: "s11a website", // Alternative site title for SEO.
  siteLogo: "logos/logo-1024.png", // Logo used for SEO and manifest.
  siteUrl: "https://s11a.com", // Domain of your website without pathPrefix.
  repo: "https://github.com/snimmagadda1/s11a.com",
  pathPrefix: "", // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription: "A personal development blog", // Website description used for RSS feeds/meta description tag.
  siteRss: "/rss.xml", // Path to the RSS file.
  disqusShortname: "https-s11a-com", // Disqus shortname.
  postDefaultCategoryID: "Tech", // Default category for posts.
  dateFromFormat: "MM-DD-YYYY", // Date format used in the frontmatter.
  dateFormat: 'MMMM Do, YYYY', // Date format for display.
  userName: "Sai Nimmagadda", // Username to display in the author segment.
  userEmail: "ExampleUser@example.com", // Email used for RSS feed's author segment
  userTwitter: "Funsaized", // Optionally renders "Follow Me" in the UserInfo segment.
  userLocation: "NC, USA", // User location to display in the author segment.
  userAvatar: "https://api.adorable.io/avatars/150/test.png", // User avatar to display in the author segment.
  userDescription:
    "Yeah, I like animals better than people sometimes... Especially dogs. Dogs are the best. Every time you come home, they act like they haven't seen you in a year. And the good thing about dogs... is they got different dogs for different people.", // User description to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  userLinks: [
    {
      label: "GitHub",
      url: "https://github.com/snimmagadda1",
      iconClassName: "fa fa-github"
    },
    {
      label: "Twitter",
      url: "https://twitter.com/FunSaized",
      iconClassName: "fa fa-twitter"
    },
    {
      label: "Email",
      url: "saiguy@me.com",
      iconClassName: "fa fa-envelope"
    }
  ],
  menuLinks: [
    {
      name: 'Me',
      link: '/about/',
    },
    {
      name: 'Articles',
      link: '/blog/',
    }
  ],
  copyright: "Copyright © 2019. Sai Nimmagadda", // Copyright string for the footer of the website and RSS feed.
  themeColor: "#9dd4cf", // Used for setting manifest and progress theme colors.
  backgroundColor: "#e0e0e0" // Used for setting manifest background color.
};

// Validate

// Make sure pathPrefix is empty if not needed
if (config.pathPrefix === "/") {
  config.pathPrefix = "";
} else {
  // Make sure pathPrefix only contains the first forward slash
  config.pathPrefix = `/${config.pathPrefix.replace(/^\/|\/$/g, "")}`;
}

// Make sure siteUrl doesn't have an ending forward slash
if (config.siteUrl.substr(-1) === "/")
  config.siteUrl = config.siteUrl.slice(0, -1);

// Make sure siteRss has a starting forward slash
if (config.siteRss && config.siteRss[0] !== "/")
  config.siteRss = `/${config.siteRss}`;

module.exports = config;
