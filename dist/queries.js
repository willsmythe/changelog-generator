"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClosedIssues = void 0;
const graphql_1 = require("@octokit/graphql");
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
const getClosedIssues = (projectIdentifiers, closedAfter, excludeLabels = []) => __awaiter(void 0, void 0, void 0, function* () {
    const issues = new Array();
    const searchQuery = `project:${projectIdentifiers.join()} state:closed is:issue updated:>=${closedAfter.toISOString().substring(0, 10)} sort:updated-desc ${excludeLabels.map(label => `-label:"${label}"`).join(' ')}`;
    console.log(`Search query: ${searchQuery}`);
    let hasNextPage = false;
    let cursor = null;
    do {
        const { issuesClosed } = yield (0, graphql_1.graphql)(query, {
            searchQuery,
            cursor,
            headers: {
                authorization: `token ${GH_TOKEN}`
            }
        });
        issuesClosed.edges.forEach(e => {
            var _a;
            issues.push({
                title: e.node.title,
                number: e.node.number,
                closedAt: new Date(e.node.closedAt),
                url: e.node.url,
                milestone: {
                    title: (_a = e.node.milestone) === null || _a === void 0 ? void 0 : _a.title
                },
                labels: e.node.labels.edges.map(e => {
                    return {
                        name: e.node.name,
                        url: e.node.url
                    };
                })
            });
        });
        hasNextPage = issuesClosed.pageInfo.hasNextPage;
        cursor = issuesClosed.pageInfo.endCursor;
    } while (hasNextPage);
    console.log(`Issues found: ${issues.length}`);
    return issues.filter(issue => issue.closedAt >= closedAfter);
});
exports.getClosedIssues = getClosedIssues;
//# sourceMappingURL=queries.js.map