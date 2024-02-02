import { graphql } from "@octokit/graphql";
import { Issue } from "./types";

const GH_TOKEN = process.env.GH_TOKEN;

const query = `\
query getIssues($searchQuery:String!, $cursor:String) {
    issuesClosed:search(type: ISSUE, query: $searchQuery, first: 20, after: $cursor) {
        pageInfo {
            hasNextPage
            endCursor
        }            
        edges {
            node {
                ... on Issue {
                    title
                    number
                    closedAt
                    url
                    milestone {
                        title
                    }
                    labels(first: 20) {
                        edges {
                            node {
                                name
                                url
                            }
                        }
                    }
                }
            }
        }
    }
}`;

export const getClosedIssues = async(
        projectIdentifiers: string[],
        closedAfter: Date,
        excludeLabels: String[] = []): Promise<Issue[]> => {
   
    const issues = new Array<Issue>();
    
    const searchQuery = `project:${projectIdentifiers.join()} state:closed is:issue updated:>=${closedAfter.toISOString().substring(0, 10)} sort:updated-desc ${excludeLabels.map(label => `-label:"${label}"`).join(' ')}`;
    console.log(`Search query: ${searchQuery}`);

    let hasNextPage = false;
    let cursor: string;

    do {
        const { issuesClosed } = await graphql<any>(query, {
            searchQuery,
            cursor,
            headers: {
                authorization: `token ${GH_TOKEN}`
            }
        });

        issuesClosed.edges.forEach(e => {
            issues.push({
                title: e.node.title,
                number: e.node.number,
                closedAt: new Date(e.node.closedAt),
                url: e.node.url,
                milestone: {
                    title: e.node.milestone?.title
                },
                labels: e.node.labels.edges.map(e => {
                    return {
                        name: e.node.name,
                        url: e.node.url
                    }
                })
            });
        });

        hasNextPage = issuesClosed.pageInfo.hasNextPage;
        cursor = issuesClosed.pageInfo.endCursor;
    } while (hasNextPage);

    console.log(`Issues found: ${issues.length}`);

    return issues.filter(issue => issue.closedAt >= closedAfter);
}
