import React, { Component } from 'react'
import GitHubButton from 'react-github-btn'
import { Project } from '../../models';

type Props = {
    projects: Project[]
}

export default class ProjectListing extends Component<Props, {}> {
    render() {
        const { projects } = this.props

        return (
            <section className="projects">
                {projects.map(project => (
                    <div className="each" key={project.title}>
                        <h2>
                            <a
                                className="project-link"
                                href={project.path}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div className="project-icon">{project.icon}</div>
                                <div className="project-title">{project.title}</div>
                            </a>
                        </h2>
                        <p>{project.description}</p>
                        <div className="buttons">
                            <GitHubButton href={project.source} data-size="large" data-show-count="true">
                                Source
                            </GitHubButton>
                            {project.path && (
                                <a className="button" href={project.path} target="_blank" rel="noopener noreferrer">
                                    View
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </section>
        )
    }
}
