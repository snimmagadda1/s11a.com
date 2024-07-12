export interface UserLink {
    label: string;
    url: string;
    iconClassName: string;
}

export interface MenuLink {
    name: string;
    link: string;
}

export interface Config {
    siteTitle: string; // Site title.
    siteTitleShort: string; // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
    siteTitleAlt: string; // Alternative site title for SEO.
    siteLogo: string; // Logo used for SEO and manifest.
    siteUrl: string; // Domain of your website without pathPrefix.
    repo: string;
    pathPrefix: string; // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
    siteDescription: string; // Website description used for RSS feeds/meta description tag.
    siteRss: string; // Path to the RSS file.
    postDefaultCategoryID: string; // Default category for posts.
    dateFromFormat: string; // Date format used in the frontmatter.
    dateFormat: string; // Date format for display.
    userName: string; // Username to display in the author segment.
    userEmail: string; // Email used for RSS feed's author segment
    userTwitter: string; // Optionally renders "Follow Me" in the UserInfo segment.
    userLocation: string; // User location to display in the author segment.
    userAvatar: string; // User avatar to display in the author segment.
    userDescription: string; // User description to display in the author segment.
    userLinks: UserLink[]; // Links to social profiles/projects you want to display in the author segment/navigation bar.
    menuLinks: MenuLink[];
    copyright: string; // Copyright string for the footer of the website and RSS feed.
    themeColor: string; // Used for setting manifest and progress theme colors.
    backgroundColor: string; // Used for setting manifest background color.
}