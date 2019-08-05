import config from '../../data/SiteConfig'
import urljoin from 'url-join'
import moment from 'moment'

const formatDate = date => moment.utc(date).format(config.dateFormat);

const editOnGithub = post => {
  const date = moment.utc(post.date).format(config.dateFromFormat)
  console.log(date);
  return urljoin(config.repo, '/blob/master/content/', `${date}`, 'index.md')
};

export { formatDate, editOnGithub }
